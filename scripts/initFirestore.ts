/**
 * Firestoreの初期データを設定するスクリプト
 * 実行方法: npx tsx scripts/initFirestore.ts
 * クリアして再投入: npx tsx scripts/initFirestore.ts --clear
 */

import { db } from '../lib/firebase'
import { collection, doc, setDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { Group, Vote, Result, Config } from '../types'

async function clearCollections() {
  console.log('🗑️  Clearing existing data...')
  
  const collections = ['groups', 'votes', 'results', 'config']
  
  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(db, collectionName))
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)
    console.log(`  ✅ Cleared ${collectionName} collection (${snapshot.size} docs)`)
  }
}

async function initializeGroups() {
  console.log('🚀 Initializing groups...')
  
  const groups = [
    { id: 'group1', name: '演劇部', order: 1 },
    { id: 'group2', name: '合唱部', order: 2 },
    { id: 'group3', name: 'ダンス部', order: 3 },
    { id: 'group4', name: '軽音楽部', order: 4 },
    { id: 'group5', name: '吹奏楽部', order: 5 },
  ]

  // グループを追加
  for (const group of groups) {
    await setDoc(doc(db, 'groups', group.id), {
      name: group.name,
      order: group.order,
      createdAt: serverTimestamp(),
    })
    console.log(`  ✅ Added group: ${group.name} (ID: ${group.id})`)
  }
  
  return groups
}

async function initializeVotes() {
  console.log('🗳️  Initializing sample votes...')
  
  const sampleVotes: Omit<Vote, 'id'>[] = [
    // 演劇部の投票
    { groupId: 'group1', groupName: '演劇部', score: 5, deviceId: 'device-001', createdAt: new Date() },
    { groupId: 'group1', groupName: '演劇部', score: 4, deviceId: 'device-002', createdAt: new Date() },
    { groupId: 'group1', groupName: '演劇部', score: 5, deviceId: 'device-003', createdAt: new Date() },
    { groupId: 'group1', groupName: '演劇部', score: 5, deviceId: 'device-004', createdAt: new Date() },
    { groupId: 'group1', groupName: '演劇部', score: 4, deviceId: 'device-005', createdAt: new Date() },
    
    // 合唱部の投票
    { groupId: 'group2', groupName: '合唱部', score: 4, deviceId: 'device-001', createdAt: new Date() },
    { groupId: 'group2', groupName: '合唱部', score: 4, deviceId: 'device-002', createdAt: new Date() },
    { groupId: 'group2', groupName: '合唱部', score: 5, deviceId: 'device-006', createdAt: new Date() },
    { groupId: 'group2', groupName: '合唱部', score: 3, deviceId: 'device-007', createdAt: new Date() },
    
    // ダンス部の投票
    { groupId: 'group3', groupName: 'ダンス部', score: 5, deviceId: 'device-001', createdAt: new Date() },
    { groupId: 'group3', groupName: 'ダンス部', score: 5, deviceId: 'device-003', createdAt: new Date() },
    { groupId: 'group3', groupName: 'ダンス部', score: 4, deviceId: 'device-008', createdAt: new Date() },
    { groupId: 'group3', groupName: 'ダンス部', score: 5, deviceId: 'device-009', createdAt: new Date() },
    { groupId: 'group3', groupName: 'ダンス部', score: 5, deviceId: 'device-010', createdAt: new Date() },
    { groupId: 'group3', groupName: 'ダンス部', score: 4, deviceId: 'device-011', createdAt: new Date() },
    
    // 軽音楽部の投票
    { groupId: 'group4', groupName: '軽音楽部', score: 3, deviceId: 'device-001', createdAt: new Date() },
    { groupId: 'group4', groupName: '軽音楽部', score: 4, deviceId: 'device-012', createdAt: new Date() },
    { groupId: 'group4', groupName: '軽音楽部', score: 3, deviceId: 'device-013', createdAt: new Date() },
    
    // 吹奏楽部の投票
    { groupId: 'group5', groupName: '吹奏楽部', score: 4, deviceId: 'device-002', createdAt: new Date() },
    { groupId: 'group5', groupName: '吹奏楽部', score: 4, deviceId: 'device-014', createdAt: new Date() },
    { groupId: 'group5', groupName: '吹奏楽部', score: 5, deviceId: 'device-015', createdAt: new Date() },
    { groupId: 'group5', groupName: '吹奏楽部', score: 4, deviceId: 'device-016', createdAt: new Date() },
    { groupId: 'group5', groupName: '吹奏楽部', score: 3, deviceId: 'device-017', createdAt: new Date() },
  ]

  for (const vote of sampleVotes) {
    const voteId = `${vote.groupId}_${vote.deviceId}`
    await setDoc(doc(db, 'votes', voteId), {
      ...vote,
      createdAt: serverTimestamp(),
    })
  }
  console.log(`  ✅ Added ${sampleVotes.length} sample votes`)
}

async function initializeResults() {
  console.log('📊 Initializing aggregated results...')
  
  const results: Result[] = [
    {
      groupId: 'group1',
      groupName: '演劇部',
      totalScore: 23,
      voteCount: 5,
      averageScore: 4.6,
      rank: 2,
      updatedAt: new Date(),
    },
    {
      groupId: 'group2',
      groupName: '合唱部',
      totalScore: 16,
      voteCount: 4,
      averageScore: 4.0,
      rank: 4,
      updatedAt: new Date(),
    },
    {
      groupId: 'group3',
      groupName: 'ダンス部',
      totalScore: 28,
      voteCount: 6,
      averageScore: 4.67,
      rank: 1,
      updatedAt: new Date(),
    },
    {
      groupId: 'group4',
      groupName: '軽音楽部',
      totalScore: 10,
      voteCount: 3,
      averageScore: 3.33,
      rank: 5,
      updatedAt: new Date(),
    },
    {
      groupId: 'group5',
      groupName: '吹奏楽部',
      totalScore: 20,
      voteCount: 5,
      averageScore: 4.0,
      rank: 3,
      updatedAt: new Date(),
    },
  ]

  for (const result of results) {
    await setDoc(doc(db, 'results', result.groupId), {
      ...result,
      updatedAt: serverTimestamp(),
    })
    console.log(`  ✅ Added result: ${result.groupName} (Rank: ${result.rank}, Avg: ${result.averageScore.toFixed(2)})`)
  }
}

async function initializeConfig() {
  console.log('⚙️  Initializing config...')
  
  const configRef = doc(db, 'config', 'settings')
  
  await setDoc(configRef, {
    currentGroup: 'group1',
    votingEnabled: true,
    resultsVisible: true,
    updateInterval: 60000, // ミリ秒
    updatedAt: serverTimestamp(),
  })
  
  console.log('  ✅ Config initialized')
}

async function main() {
  try {
    console.log('🔥 Starting Firestore initialization...')
    console.log('')
    
    // --clearフラグがある場合は既存データを削除
    if (process.argv.includes('--clear')) {
      await clearCollections()
      console.log('')
    }
    
    const groups = await initializeGroups()
    await initializeVotes()
    await initializeResults()
    await initializeConfig()
    
    console.log('')
    console.log('✨ Firestore initialization completed!')
    console.log('')
    console.log('📄 Summary:')
    console.log(`  - Groups: ${groups.length}`)
    console.log(`  - Sample votes: 24`)
    console.log(`  - Aggregated results: ${groups.length}`)
    console.log(`  - Config: 1`)
    console.log('')
    console.log('🌐 You can now access:')
    console.log('  - Vote page: http://localhost:3002/vote')
    console.log('  - Results page: http://localhost:3002/results')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// 実行
main()