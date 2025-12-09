import numpy as np
import pandas as pd
from scipy import stats
from scipy.optimize import minimize
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class GammaPoissonMixture:
    def __init__(self, alpha: float = 2.0, beta: float = 1.0):
        self.alpha = alpha
        self.beta = beta
        self.lambda_samples = []
    
    def fit(self, purchase_data: np.ndarray, n_iter: int = 1000):
        n = len(purchase_data)
        sum_purchases = np.sum(purchase_data)
        
        for _ in range(n_iter):
            self.alpha = (self.alpha + sum_purchases) / (1 + n / self.beta)
            self.beta = (self.beta + n) / (self.alpha + sum_purchases / n)
        
        self.lambda_samples = np.random.gamma(self.alpha, 1/self.beta, 10000)
        return self
    
    def predict_demand(self, n_samples: int = 1000) -> np.ndarray:
        lambda_vals = np.random.gamma(self.alpha, 1/self.beta, n_samples)
        predictions = np.random.poisson(lambda_vals)
        return predictions
    
    def get_distribution_params(self) -> Dict[str, float]:
        return {
            'alpha': float(self.alpha),
            'beta': float(self.beta),
            'mean': float(self.alpha / self.beta),
            'variance': float(self.alpha / (self.beta ** 2))
        }

class PriceElasticityModel:
    def __init__(self):
        self.elasticity_coefficients = {}
        self.base_demand = {}
        self.scaler = StandardScaler()
    
    def calculate_elasticity(self, prices: np.ndarray, quantities: np.ndarray, 
                           product_id: str) -> float:
        log_prices = np.log(prices + 1e-10)
        log_quantities = np.log(quantities + 1e-10)
        
        coefficients = np.polyfit(log_prices, log_quantities, 1)
        elasticity = coefficients[0]
        
        self.elasticity_coefficients[product_id] = elasticity
        self.base_demand[product_id] = np.mean(quantities)
        
        return elasticity
    
    def predict_demand(self, current_price: float, new_price: float, 
                      product_id: str) -> float:
        if product_id not in self.elasticity_coefficients:
            return self.base_demand.get(product_id, 0)
        
        elasticity = self.elasticity_coefficients[product_id]
        price_change_ratio = new_price / current_price
        demand_change = price_change_ratio ** elasticity
        
        predicted_demand = self.base_demand[product_id] * demand_change
        return predicted_demand
    
    def get_optimal_price(self, product_id: str, cost: float, 
                         current_price: float, price_range: Tuple[float, float]) -> Dict:
        def revenue_objective(price):
            demand = self.predict_demand(current_price, price[0], product_id)
            revenue = (price[0] - cost) * demand
            return -revenue
        
        result = minimize(revenue_objective, x0=[current_price], 
                        bounds=[price_range], method='L-BFGS-B')
        
        optimal_price = result.x[0]
        optimal_demand = self.predict_demand(current_price, optimal_price, product_id)
        optimal_revenue = (optimal_price - cost) * optimal_demand
        
        return {
            'optimal_price': float(optimal_price),
            'expected_demand': float(optimal_demand),
            'expected_revenue': float(optimal_revenue),
            'elasticity': float(self.elasticity_coefficients.get(product_id, 0))
        }

class BayesianABTest:
    def __init__(self, prior_alpha: float = 1.0, prior_beta: float = 1.0):
        self.prior_alpha = prior_alpha
        self.prior_beta = prior_beta
        self.results = {}
    
    def update_variant(self, variant_name: str, conversions: int, trials: int):
        posterior_alpha = self.prior_alpha + conversions
        posterior_beta = self.prior_beta + trials - conversions
        
        self.results[variant_name] = {
            'alpha': posterior_alpha,
            'beta': posterior_beta,
            'mean': posterior_alpha / (posterior_alpha + posterior_beta),
            'conversions': conversions,
            'trials': trials
        }
    
    def get_probability_best(self, n_samples: int = 10000) -> Dict[str, float]:
        if len(self.results) < 2:
            return {}
        
        samples = {}
        for variant, params in self.results.items():
            samples[variant] = np.random.beta(params['alpha'], params['beta'], n_samples)
        
        probabilities = {}
        for variant in samples.keys():
            best_count = sum(samples[variant] == max([samples[v][i] for v in samples.keys()]) 
                           for i in range(n_samples))
            probabilities[variant] = best_count / n_samples
        
        return probabilities
    
    def calculate_expected_loss(self, variant: str, n_samples: int = 10000) -> float:
        if variant not in self.results:
            return 0.0
        
        samples = {v: np.random.beta(p['alpha'], p['beta'], n_samples) 
                  for v, p in self.results.items()}
        
        max_samples = np.maximum.reduce(list(samples.values()))
        loss = np.mean(max_samples - samples[variant])
        
        return float(loss)

class BayesianOptimizer:
    def __init__(self, bounds: List[Tuple[float, float]], n_initial: int = 5):
        self.bounds = bounds
        self.n_initial = n_initial
        self.X_sample = []
        self.y_sample = []
        self.best_params = None
        self.best_value = -np.inf
    
    def acquisition_function(self, X: np.ndarray, xi: float = 0.01) -> np.ndarray:
        if len(self.y_sample) == 0:
            return np.zeros(len(X))
        
        y_array = np.array(self.y_sample)
        mu = np.mean(y_array)
        sigma = np.std(y_array) + 1e-6
        
        best_f = np.max(y_array)
        
        Z = (mu - best_f - xi) / sigma
        ei = (mu - best_f - xi) * stats.norm.cdf(Z) + sigma * stats.norm.pdf(Z)
        
        return ei
    
    def propose_location(self) -> np.ndarray:
        if len(self.X_sample) < self.n_initial:
            return np.array([np.random.uniform(b[0], b[1]) for b in self.bounds])
        
        n_random = 1000
        X_random = np.random.uniform(
            [b[0] for b in self.bounds],
            [b[1] for b in self.bounds],
            size=(n_random, len(self.bounds))
        )
        
        ei_values = self.acquisition_function(X_random)
        best_idx = np.argmax(ei_values)
        
        return X_random[best_idx]
    
    def update(self, X: np.ndarray, y: float):
        self.X_sample.append(X)
        self.y_sample.append(y)
        
        if y > self.best_value:
            self.best_value = y
            self.best_params = X.copy()
    
    def get_best_params(self) -> Dict:
        return {
            'parameters': self.best_params.tolist() if self.best_params is not None else [],
            'best_value': float(self.best_value),
            'n_iterations': len(self.X_sample)
        }

class DynamicPricingEngine:
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.gamma_poisson_models = {}
        self.elasticity_model = PriceElasticityModel()
        self.ab_test = BayesianABTest()
        self.optimizer = None
        self.pricing_history = []
        
    def train_demand_model(self, product_id: str, purchase_history: List[int]):
        model = GammaPoissonMixture()
        model.fit(np.array(purchase_history))
        self.gamma_poisson_models[product_id] = model
        return model.get_distribution_params()
    
    def train_elasticity(self, product_id: str, historical_data: pd.DataFrame):
        prices = historical_data['price'].values
        quantities = historical_data['quantity'].values
        elasticity = self.elasticity_model.calculate_elasticity(prices, quantities, product_id)
        return elasticity
    
    def run_ab_test(self, variants: Dict[str, Dict[str, int]]) -> Dict:
        for variant_name, data in variants.items():
            self.ab_test.update_variant(variant_name, data['conversions'], data['trials'])
        
        probabilities = self.ab_test.get_probability_best()
        
        results = {
            'probabilities': probabilities,
            'expected_loss': {v: self.ab_test.calculate_expected_loss(v) for v in variants.keys()},
            'variant_stats': self.ab_test.results
        }
        
        return results
    
    def optimize_price(self, product_id: str, current_price: float, cost: float,
                      competitor_prices: List[float], inventory_level: int,
                      target_inventory: int) -> Dict:
        
        min_competitor_price = min(competitor_prices) if competitor_prices else current_price * 0.8
        max_competitor_price = max(competitor_prices) if competitor_prices else current_price * 1.2
        
        inventory_factor = 1.0
        if inventory_level > target_inventory * 1.2:
            inventory_factor = 0.95
        elif inventory_level < target_inventory * 0.8:
            inventory_factor = 1.05
        
        price_range = (
            max(cost * 1.1, min_competitor_price * 0.95 * inventory_factor),
            min(current_price * 1.5, max_competitor_price * 1.05 * inventory_factor)
        )
        
        optimal_result = self.elasticity_model.get_optimal_price(
            product_id, cost, current_price, price_range
        )
        
        if product_id in self.gamma_poisson_models:
            demand_prediction = self.gamma_poisson_models[product_id].predict_demand(1000)
            optimal_result['demand_confidence_interval'] = [
                float(np.percentile(demand_prediction, 5)),
                float(np.percentile(demand_prediction, 95))
            ]
        
        self.pricing_history.append({
            'timestamp': datetime.now().isoformat(),
            'product_id': product_id,
            'recommended_price': optimal_result['optimal_price'],
            'current_price': current_price,
            'inventory_level': inventory_level
        })
        
        return optimal_result
    
    def run_bayesian_optimization(self, objective_function, bounds: List[Tuple[float, float]],
                                 n_iterations: int = 20) -> Dict:
        self.optimizer = BayesianOptimizer(bounds)
        
        for i in range(n_iterations):
            X_next = self.optimizer.propose_location()
            y_next = objective_function(X_next)
            self.optimizer.update(X_next, y_next)
        
        return self.optimizer.get_best_params()
    
    def generate_pricing_report(self, product_ids: List[str]) -> Dict:
        report = {
            'timestamp': datetime.now().isoformat(),
            'products': {},
            'summary': {
                'total_products': len(product_ids),
                'avg_elasticity': 0.0,
                'optimization_history_length': len(self.pricing_history)
            }
        }
        
        elasticities = []
        for pid in product_ids:
            product_info = {}
            
            if pid in self.gamma_poisson_models:
                product_info['demand_model'] = self.gamma_poisson_models[pid].get_distribution_params()
            
            if pid in self.elasticity_model.elasticity_coefficients:
                product_info['elasticity'] = float(self.elasticity_model.elasticity_coefficients[pid])
                elasticities.append(product_info['elasticity'])
            
            report['products'][pid] = product_info
        
        if elasticities:
            report['summary']['avg_elasticity'] = float(np.mean(elasticities))
        
        return report
    
    def export_state(self) -> str:
        state = {
            'gamma_poisson_models': {
                pid: model.get_distribution_params() 
                for pid, model in self.gamma_poisson_models.items()
            },
            'elasticity_coefficients': self.elasticity_model.elasticity_coefficients,
            'base_demand': self.elasticity_model.base_demand,
            'pricing_history': self.pricing_history[-100:],
            'config': self.config
        }
        return json.dumps(state, indent=2)

if __name__ == "__main__":
    engine = DynamicPricingEngine()
    
    np.random.seed(42)
    purchase_history = np.random.poisson(15, 100).tolist()
    demand_params = engine.train_demand_model('product_001', purchase_history)
    print("Gamma-Poisson Model Parameters:", demand_params)
    
    historical_data = pd.DataFrame({
        'price': np.linspace(20, 50, 50),
        'quantity': 2000 - 30 * np.linspace(20, 50, 50) + np.random.normal(0, 50, 50)
    })
    elasticity = engine.train_elasticity('product_001', historical_data)
    print(f"Price Elasticity: {elasticity:.3f}")
    
    variants = {
        'control': {'conversions': 180, 'trials': 5000},
        'variant_a': {'conversions': 210, 'trials': 5000},
        'variant_b': {'conversions': 195, 'trials': 5000}
    }
    ab_results = engine.run_ab_test(variants)
    print("A/B Test Results:", ab_results['probabilities'])
    
    optimization_result = engine.optimize_price(
        product_id='product_001',
        current_price=35.0,
        cost=20.0,
        competitor_prices=[33.0, 37.0, 36.5],
        inventory_level=450,
        target_inventory=400
    )
    print("Optimization Result:", optimization_result)
    
    def sample_objective(params):
        price = params[0]
        return -(price - 25)**2 + 100
    
    bayesian_result = engine.run_bayesian_optimization(
        objective_function=sample_objective,
        bounds=[(20.0, 50.0)],
        n_iterations=15
    )
    print("Bayesian Optimization Result:", bayesian_result)
    
    report = engine.generate_pricing_report(['product_001'])
    print("\nPricing Report:", json.dumps(report, indent=2))
    
    state = engine.export_state()
    with open('pricing_engine_state.json', 'w') as f:
        f.write(state)
    print("\nEngine state exported successfully")