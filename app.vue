<template>
  <div class="pricing-app">
    <header class="app-header">
      <h1>Dynamic Pricing Engine</h1>
      <nav>
        <button @click="activeView = 'dashboard'" :class="{ active: activeView === 'dashboard' }">
          Dashboard
        </button>
        <button @click="activeView = 'products'" :class="{ active: activeView === 'products' }">
          Products
        </button>
        <button @click="activeView = 'abtest'" :class="{ active: activeView === 'abtest' }">
          A/B Testing
        </button>
        <button @click="activeView = 'analytics'" :class="{ active: activeView === 'analytics' }">
          Analytics
        </button>
      </nav>
    </header>

    <main class="app-main">
      <DashboardView v-if="activeView === 'dashboard'" />
      <ProductsView v-else-if="activeView === 'products'" />
      <ABTestView v-else-if="activeView === 'abtest'" />
      <AnalyticsView v-else-if="activeView === 'analytics'" />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const activeView = ref('dashboard')
const apiBaseUrl = ref('http://localhost:8000/api')

const state = reactive({
  products: [],
  pricingHistory: [],
  abTests: [],
  revenueMetrics: null,
  loading: false
})

const fetchProducts = async () => {
  try {
    state.loading = true
    const response = await fetch(`${apiBaseUrl.value}/products`)
    const data = await response.json()
    if (data.success) {
      state.products = data.data
    }
  } catch (error) {
    console.error('Error fetching products:', error)
  } finally {
    state.loading = false
  }
}

const fetchPricingHistory = async () => {
  try {
    const response = await fetch(`${apiBaseUrl.value}/pricing-history`)
    const data = await response.json()
    if (data.success) {
      state.pricingHistory = data.data
    }
  } catch (error) {
    console.error('Error fetching pricing history:', error)
  }
}

const fetchABTests = async () => {
  try {
    const response = await fetch(`${apiBaseUrl.value}/ab-tests`)
    const data = await response.json()
    if (data.success) {
      state.abTests = data.data
    }
  } catch (error) {
    console.error('Error fetching A/B tests:', error)
  }
}

const fetchRevenueMetrics = async () => {
  try {
    const response = await fetch(`${apiBaseUrl.value}/revenue-metrics`)
    const data = await response.json()
    if (data.success) {
      state.revenueMetrics = data.data
    }
  } catch (error) {
    console.error('Error fetching revenue metrics:', error)
  }
}

const optimizePrice = async (productId, currentPrice, cost, inventory, competitorPrices) => {
  try {
    const response = await fetch(`${apiBaseUrl.value}/optimize-price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: productId,
        current_price: currentPrice,
        cost: cost,
        inventory: inventory,
        competitor_prices: competitorPrices
      })
    })
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error optimizing price:', error)
    return null
  }
}

const createABTest = async (productId, variants) => {
  try {
    const response = await fetch(`${apiBaseUrl.value}/create-ab-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: productId,
        variants: variants
      })
    })
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error creating A/B test:', error)
    return null
  }
}

onMounted(() => {
  fetchProducts()
  fetchPricingHistory()
  fetchABTests()
  fetchRevenueMetrics()
})

provide('state', state)
provide('fetchProducts', fetchProducts)
provide('fetchPricingHistory', fetchPricingHistory)
provide('fetchABTests', fetchABTests)
provide('optimizePrice', optimizePrice)
provide('createABTest', createABTest)
</script>

<script>
export default {
  components: {
    DashboardView: {
      template: `
        <div class="dashboard-view">
          <div class="metrics-grid">
            <div class="metric-card">
              <h3>Total Revenue</h3>
              <p class="metric-value">$482,340</p>
              <span class="metric-change positive">+18.5%</span>
            </div>
            <div class="metric-card">
              <h3>Units Sold</h3>
              <p class="metric-value">15,420</p>
              <span class="metric-change positive">+12.3%</span>
            </div>
            <div class="metric-card">
              <h3>Avg Order Value</h3>
              <p class="metric-value">$31.27</p>
              <span class="metric-change positive">+5.4%</span>
            </div>
            <div class="metric-card">
              <h3>Conversion Rate</h3>
              <p class="metric-value">3.9%</p>
              <span class="metric-change positive">+0.8%</span>
            </div>
          </div>
          <div class="chart-section">
            <h2>Revenue Performance</h2>
            <div class="chart-placeholder">
              Chart visualization would appear here
            </div>
          </div>
        </div>
      `
    },
    ProductsView: {
      template: `
        <div class="products-view">
          <div class="products-header">
            <h2>Product Management</h2>
            <button class="btn-primary">Add Product</button>
          </div>
          <div class="products-table">
            <table>
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Name</th>
                  <th>Current Price</th>
                  <th>Cost</th>
                  <th>Inventory</th>
                  <th>Elasticity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>PROD001</td>
                  <td>Premium Widget</td>
                  <td>$29.99</td>
                  <td>$15.50</td>
                  <td>450</td>
                  <td>-1.8</td>
                  <td>
                    <button class="btn-small">Optimize</button>
                    <button class="btn-small">Edit</button>
                  </td>
                </tr>
                <tr>
                  <td>PROD002</td>
                  <td>Standard Gadget</td>
                  <td>$49.99</td>
                  <td>$28.00</td>
                  <td>320</td>
                  <td>-2.3</td>
                  <td>
                    <button class="btn-small">Optimize</button>
                    <button class="btn-small">Edit</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `
    },
    ABTestView: {
      template: `
        <div class="abtest-view">
          <div class="abtest-header">
            <h2>A/B Testing Dashboard</h2>
            <button class="btn-primary">Create New Test</button>
          </div>
          <div class="test-cards">
            <div class="test-card">
              <div class="test-card-header">
                <h3>TEST001 - Product A Pricing</h3>
                <span class="badge running">Running</span>
              </div>
              <div class="test-variants">
                <div class="variant">
                  <h4>Control ($29.99)</h4>
                  <p>Conversions: 180 / 5000</p>
                  <p>Revenue: $5,398.20</p>
                </div>
                <div class="variant winner">
                  <h4>Variant A ($27.99)</h4>
                  <p>Conversions: 210 / 5000</p>
                  <p>Revenue: $5,877.90</p>
                  <span class="winner-badge">Winner (95% confidence)</span>
                </div>
                <div class="variant">
                  <h4>Variant B ($28.49)</h4>
                  <p>Conversions: 195 / 5000</p>
                  <p>Revenue: $5,555.55</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    },
    AnalyticsView: {
      template: `
        <div class="analytics-view">
          <h2>Advanced Analytics</h2>
          <div class="analytics-grid">
            <div class="analytics-card">
              <h3>Price Elasticity Trends</h3>
              <div class="chart-placeholder">Elasticity chart</div>
            </div>
            <div class="analytics-card">
              <h3>Demand Forecasting</h3>
              <div class="chart-placeholder">Forecast chart</div>
            </div>
            <div class="analytics-card">
              <h3>Competitor Analysis</h3>
              <div class="chart-placeholder">Competitor chart</div>
            </div>
            <div class="analytics-card">
              <h3>Revenue Attribution</h3>
              <div class="chart-placeholder">Attribution chart</div>
            </div>
          </div>
        </div>
      `
    }
  }
}
</script>

<style scoped>
.pricing-app {
  min-height: 100vh;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.app-header {
  background: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.app-header h1 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.8rem;
}

.app-header nav {
  display: flex;
  gap: 1rem;
}

.app-header nav button {
  padding: 0.5rem 1.5rem;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.app-header nav button.active {
  background: #0088FE;
  color: white;
}

.app-main {
  padding: 0 2rem 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.metric-card h3 {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.metric-value {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}

.metric-change {
  font-size: 0.9rem;
  font-weight: 500;
}

.metric-change.positive {
  color: #00C49F;
}

.chart-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-placeholder {
  height: 300px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.products-header, .abtest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #0088FE;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #0077DD;
}

.products-table {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow-x: auto;
}

.products-table table {
  width: 100%;
  border-collapse: collapse;
}

.products-table th {
  text-align: left;
  padding: 1rem;
  border-bottom: 2px solid #e0e0e0;
  font-weight: 600;
  color: #333;
}

.products-table td {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.btn-small {
  padding: 0.4rem 0.8rem;
  margin-right: 0.5rem;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.btn-small:hover {
  background: #e0e0e0;
}

.test-cards {
  display: grid;
  gap: 1.5rem;
}

.test-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.test-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.badge {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge.running {
  background: #00C49F;
  color: white;
}

.test-variants {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.variant {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.variant.winner {
  background: #E8F8F5;
  border: 2px solid #00C49F;
}

.winner-badge {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.3rem 0.6rem;
  background: #00C49F;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.analytics-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.analytics-card h3 {
  margin: 0 0 1rem 0;
  color: #333;
}
</style>