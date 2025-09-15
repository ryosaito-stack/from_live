/**
 * 既存の投票データから集計結果を作成
 * Node.jsで直接実行: node scripts/create-results-from-votes.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDfHS0hIFCrVzbF427WfJMSLHJBtm8ppKY",
  authDomain: "form-live.firebaseapp.com", 
  projectId: "form-live",
  storageBucket: "form-live.firebasestorage.app",
  messagingSenderId: "668821125303",
  appId: "1:668821125303:web:236d794fd64d7ca97b7532"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createResultsFromVotes() {
  console.log('📊 Creating results from existing votes...');
  
  try {
    // 1. 全ての団体を取得
    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    const groups = [];
    groupsSnapshot.forEach(doc => {
      groups.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Found ${groups.length} groups`);

    // 2. 全ての投票を取得
    const votesSnapshot = await getDocs(collection(db, 'votes'));
    const votes = [];
    votesSnapshot.forEach(doc => {
      votes.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Found ${votes.length} votes`);

    // 3. 団体ごとに集計
    const results = [];
    for (const group of groups) {
      const groupVotes = votes.filter(vote => vote.groupId === group.id);
      
      if (groupVotes.length === 0) {
        // 投票がない場合は0点
        results.push({
          groupId: group.id,
          groupName: group.name,
          totalScore: 0,
          voteCount: 0,
          averageScore: 0,
          rank: 0
        });
      } else {
        const totalScore = groupVotes.reduce((sum, vote) => sum + (vote.score || 0), 0);
        const voteCount = groupVotes.length;
        const averageScore = Math.round((totalScore / voteCount) * 100) / 100;
        
        results.push({
          groupId: group.id,
          groupName: group.name,
          totalScore,
          voteCount,
          averageScore,
          rank: 0 // 後で計算
        });
      }
    }

    // 4. ランキングを計算（平均点の降順）
    results.sort((a, b) => b.averageScore - a.averageScore);
    let currentRank = 1;
    let previousScore = results[0]?.averageScore;
    
    results.forEach((result, index) => {
      if (index > 0 && result.averageScore < previousScore) {
        currentRank = index + 1;
      }
      result.rank = currentRank;
      previousScore = result.averageScore;
    });

    // 5. Firestoreに保存
    console.log('💾 Saving results to Firestore...');
    for (const result of results) {
      await setDoc(doc(db, 'results', result.groupId), {
        ...result,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Saved result for ${result.groupName}: ${result.totalScore}点 (平均${result.averageScore}) - ${result.rank}位`);
    }

    console.log('🎉 Results created successfully!');
    console.log(`📊 Created ${results.length} result records`);
    
  } catch (error) {
    console.error('❌ Error creating results:', error);
  }
}

createResultsFromVotes();