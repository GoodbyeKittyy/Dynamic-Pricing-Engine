import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';

const DynamicPricingDashboard = () => {
  const [revenue, setRevenue] = useState([]);
  const [elasticity, setElasticity] = useState([]);
  const [segments, setSegments] = useState([]);
  const [abTest, setAbTest] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [priceOptimization, setPriceOptimization] = useState([]);
  const [demandForecast, setDemandForecast] = useState([]);
  const [conversionRate, setConversionRate] = useState([]);
  
  const [selectedProduct, setSelectedProduct] = useState('Product_A');
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [optimizationMethod, setOptimizationMethod] = useState('bayesian');
  const [isRunning, setIsRunning] = useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    generateInitialData();
  }, []);

  const generateInitialData = () => {
    const revenueData = Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      baseline: 45000 + Math.random() * 10000,
      optimized: 52000 + Math.random() * 12000,
      lift: 12 + Math.random() * 8
    }));
    setRevenue(revenueData);

    const elasticityData = [
      { product: 'Product_A', elasticity: -1.8, price: 29.99, demand: 1200 },
      { product: 'Product_B', elasticity: -2.3, price: 49.99, demand: 850 },
      { product: 'Product_C', elasticity: -1.2, price: 19.99, demand: 2100 },
      { product: 'Product_D', elasticity: -3.1, price: 89.99, demand: 420 },
      { product: 'Product_E', elasticity: -1.6, price: 34.99, demand: 980 }
    ];
    setElasticity(elasticityData);

    const segmentData = [
      { segment: 'Premium', count: 1250, avgPrice: 78.50, convRate: 4.2 },
      { segment: 'Standard', count: 3400, avgPrice: 42.30, convRate: 3.8 },
      { segment: 'Budget', count: 2100, avgPrice: 24.90, convRate: 5.1 },
      { segment: 'Luxury', count: 680, avgPrice: 125.00, convRate: 2.9 }
    ];
    setSegments(segmentData);

    const abTestData = [
      { variant: 'Control', revenue: 48200, conversions: 1820, price: 29.99 },
      { variant: 'Test_A', revenue: 52400, conversions: 1950, price: 27.99 },
      { variant: 'Test_B', revenue: 50100, conversions: 1880, price: 28.49 },
      { variant: 'Test_C', revenue: 54800, conversions: 2040, price: 26.99 }
    ];
    setAbTest(abTestData);

    const inventoryData = [
      { product: 'Product_A', stock: 450, optimal: 380, price: 29.99 },
      { product: 'Product_B', stock: 120, optimal: 200, price: 49.99 },
      { product: 'Product_C', stock: 890, optimal: 650, price: 19.99 },
      { product: 'Product_D', stock: 45, optimal: 80, price: 89.99 },
      { product: 'Product_E', stock: 320, optimal: 290, price: 34.99 }
    ];
    setInventory(inventoryData);

    const competitorData = [
      { competitor: 'Comp_1', price: 31.99, market_share: 22 },
      { competitor: 'Comp_2', price: 28.49, market_share: 18 },
      { competitor: 'Comp_3', price: 29.99, market_share: 15 },
      { competitor: 'Our_Price', price: 29.99, market_share: 25 }
    ];
    setCompetitors(competitorData);

    const optimizationData = Array.from({ length: 20 }, (_, i) => ({
      iteration: i + 1,
      expectedRevenue: 48000 + i * 250 + Math.random() * 500,
      price: 29.99 - i * 0.15 + Math.random() * 0.5
    }));
    setPriceOptimization(optimizationData);

    const forecastData = Array.from({ length: 14 }, (_, i) => ({
      day: `D${i + 1}`,
      predicted: 800 + Math.random() * 400,
      actual: i < 7 ? 780 + Math.random() * 420 : null,
      confidence_upper: 1100 + Math.random() * 200,
      confidence_lower: 600 + Math.random() * 150
    }));
    setDemandForecast(forecastData);

    const conversionData = Array.from({ length: 10 }, (_, i) => ({
      pricePoint: 20 + i * 3,
      conversionRate: 6.5 - i * 0.4 + Math.random() * 0.3
    }));
    setConversionRate(conversionData);
  };

  const handlePriceOptimization = () => {
    setIsRunning(true);
    setTimeout(() => {
      const newOptimization = Array.from({ length: 20 }, (_, i) => ({
        iteration: i + 1,
        expectedRevenue: 48000 + i * 300 + Math.random() * 600,
        price: 29.99 + priceAdjustment - i * 0.12 + Math.random() * 0.4
      }));
      setPriceOptimization(newOptimization);
      setIsRunning(false);
    }, 1500);
  };

  const resetDashboard = () => {
    setPriceAdjustment(0);
    setOptimizationMethod('bayesian');
    generateInitialData();
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#FFD700', padding: '20px', marginBottom: '20px', borderRadius: '4px' }}>
        <h1 style={{ margin: 0, fontWeight: 'bold', fontSize: '24px', textAlign: 'center' }}>DYNAMIC PRICING ENGINE - CONTROL CENTER</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '12px' }}>Product Selection</label>
          <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option>Product_A</option>
            <option>Product_B</option>
            <option>Product_C</option>
            <option>Product_D</option>
            <option>Product_E</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '12px' }}>Price Adjustment (%)</label>
          <input type="number" value={priceAdjustment} onChange={(e) => setPriceAdjustment(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} step="0.5" />
        </div>
        
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '12px' }}>Optimization Method</label>
          <select value={optimizationMethod} onChange={(e) => setOptimizationMethod(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="bayesian">Bayesian Optimization</option>
            <option value="gradient">Gradient Descent</option>
            <option value="genetic">Genetic Algorithm</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <button onClick={handlePriceOptimization} disabled={isRunning} style={{ flex: 1, padding: '8px', backgroundColor: '#0088FE', color: 'white', border: 'none', borderRadius: '4px', cursor: isRunning ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            {isRunning ? 'RUNNING...' : 'OPTIMIZE'}
          </button>
          <button onClick={resetDashboard} style={{ flex: 1, padding: '8px', backgroundColor: '#FF8042', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            RESET
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ backgroundColor: '#FFD700', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>REVENUE LIFT ANALYSIS</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" style={{ fontSize: '11px' }} />
              <YAxis style={{ fontSize: '11px' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="baseline" stroke={COLORS[0]} strokeWidth={2} />
              <Line type="monotone" dataKey="optimized" stroke={COLORS[1]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ backgroundColor: '#FFD700', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>PRICE ELASTICITY BY PRODUCT</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={elasticity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product" style={{ fontSize: '11px' }} />
              <YAxis style={{ fontSize: '11px' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="elasticity" fill={COLORS[2]}>
                {elasticity.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ backgroundColor: '#FFD700', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>CUSTOMER SEGMENT PERFORMANCE</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={segments}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="segment" style={{ fontSize: '11px' }} />
              <YAxis style={{ fontSize: '11px' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="count" fill={COLORS[0]} />
              <Bar dataKey="convRate" fill={COLORS[3]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ backgroundColor: '#FFD700', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>A/B TEST RESULTS</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={abTest}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="variant" style={{ fontSize: '11px' }} />
              <YAxis style={{ fontSize: '11px' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="revenue" fill={COLORS[1]} />
              <Bar dataKey="conversions" fill={COLORS[4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ backgroundColor: '#FFD700', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>INVENTORY VS OPTIMAL LEVELS</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={inventory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product" style={{ fontSize: '11px' }} />
              <YAxis style={{ fontSize: '11px' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="stock" fill={COLORS[2]} />
              <Bar dataKey="optimal" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ backgroundColor: '#FFD700', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>COMPETITOR PRICE COMPARISON</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={competitors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="competitor" style={{ fontSize: '11px' }} />
              <YAxis style={{ fontSize: '11px' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="price" fill={COLORS[3]}>
                {competitors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.competitor === 'Our_Price' ? COLORS[1] : COLORS[3]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ backgroundColor: '#FFD700', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>BAYESIAN OPTIMIZATION PATH</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={priceOptimization}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="iteration" style={{ fontSize: '11px' }} />
              <YAxis style={{ fontSize: '11px' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="expectedRevenue" stroke={COLORS[4]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ backgroundColor: '#FFD700', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>DEMAND FORECAST (14-DAY)</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={demandForecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" style={{ fontSize: '11px' }} />
              <YAxis style={{ fontSize: '11px' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="predicted" stroke={COLORS[0]} strokeWidth={2} />
              <Line type="monotone" dataKey="actual" stroke={COLORS[1]} strokeWidth={2} />
              <Line type="monotone" dataKey="confidence_upper" stroke={COLORS[2]} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="confidence_lower" stroke={COLORS[2]} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ backgroundColor: '#FFD700', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>CONVERSION RATE VS PRICE</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pricePoint" name="Price" style={{ fontSize: '11px' }} />
              <YAxis dataKey="conversionRate" name="Conv Rate" style={{ fontSize: '11px' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={conversionRate} fill={COLORS[1]} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center', fontSize: '12px', color: '#666' }}>
        Gamma-Poisson Mixture Model | Real-time Price Optimization | Bayesian A/B Testing Framework
      </div>
    </div>
  );
};

export default DynamicPricingDashboard;