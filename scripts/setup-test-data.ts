/**
 * テストデータセットアップスクリプト
 * npm run setup-test-data で実行
 */

import { collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { validateFirebaseConfig } from '../utils/firebase-config'

async function setupTestData() {
  console.log('🔧 Setting up test data...')
  
  // Firebase設定の確認
  const validation = validateFirebaseConfig()
  if (!validation.isValid) {
    console.error('❌ Firebase configuration is invalid:', validation.error)
    return
  }
  
  try {
    // 1. 団体データを作成
    const groups = [
      { id: 'group1', name: '団体A' },
      { id: 'group2', name: '団体B' },
      { id: 'group3', name: '団体C' },
    ]

    console.log('📝 Creating groups...')
    for (const group of groups) {
      await setDoc(doc(db, 'groups', group.id), {
        ...group,
        createdAt: serverTimestamp(),
        order: groups.indexOf(group) + 1,
      })
    }

    // 2. テスト投票データを作成
    console.log('🗳️ Creating test votes...')
    const testVotes = [
      { groupId: 'group1', groupName: '団体A', score: 5, deviceId: 'device-test1' },
      { groupId: 'group1', groupName: '団体A', score: 4, deviceId: 'device-test2' },
      { groupId: 'group1', groupName: '団体A', score: 5, deviceId: 'device-test3' },
      { groupId: 'group2', groupName: '団体B', score: 4, deviceId: 'device-test4' },
      { groupId: 'group2', groupName: '団体B', score: 3, deviceId: 'device-test5' },
      { groupId: 'group3', groupName: '団体C', score: 5, deviceId: 'device-test6' },
    ]

    for (const vote of testVotes) {
      await addDoc(collection(db, 'votes'), {
        ...vote,
        createdAt: serverTimestamp(),
      })
    }

    // 3. 集計結果を作成
    console.log('📊 Creating aggregated results...')
    const results = [
      {
        groupId: 'group1',
        groupName: '団体A',
        totalScore: 14,
        voteCount: 3,
        averageScore: 4.67,
        rank: 1,
      },
      {
        groupId: 'group2', 
        groupName: '団体B',
        totalScore: 7,
        voteCount: 2,
        averageScore: 3.5,
        rank: 2,
      },
      {
        groupId: 'group3',
        groupName: '団体C', 
        totalScore: 5,
        voteCount: 1,
        averageScore: 5.0,
        rank: 3,
      },
    ]

    for (const result of results) {
      await setDoc(doc(db, 'results', result.groupId), {
        ...result,
        updatedAt: serverTimestamp(),
      })
    }

    // 4. 設定データを作成
    console.log('⚙️ Creating config...')
    await setDoc(doc(db, 'config', 'system'), {
      votingEnabled: true,
      resultsVisible: true, 
      updateInterval: 60,
      aggregationEnabled: true,
    })

    console.log('✅ Test data setup completed!')
    console.log('📝 Groups: 3 created')
    console.log('🗳️ Votes: 6 created') 
    console.log('📊 Results: 3 created')
    console.log('⚙️ Config: 1 created')
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error)
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  setupTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}