/**
 * 既存の投票データから集計結果を作成するスクリプト
 * npm run aggregate で実行
 */

import { AggregationService } from '../services/aggregationService'
import { validateFirebaseConfig } from '../utils/firebase-config'

async function aggregateResults() {
  console.log('🔧 Aggregating results from existing vote data...')
  
  // Firebase設定の確認
  const validation = validateFirebaseConfig()
  if (!validation.isValid) {
    console.error('❌ Firebase configuration is invalid:', validation.error)
    return
  }
  
  try {
    console.log('📊 Running batch aggregation...')
    await AggregationService.batchAggregate()
    console.log('✅ Aggregation completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during aggregation:', error)
    throw error
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  aggregateResults()
    .then(() => {
      console.log('🎉 Results aggregation completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}

export { aggregateResults }