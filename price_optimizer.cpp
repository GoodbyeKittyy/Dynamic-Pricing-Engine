#include <iostream>
#include <vector>
#include <cmath>
#include <random>
#include <algorithm>
#include <numeric>
#include <map>
#include <functional>
#include <memory>

class GammaPoissonModel {
private:
    double alpha;
    double beta;
    std::mt19937 rng;
    
public:
    GammaPoissonModel(double a = 2.0, double b = 1.0) 
        : alpha(a), beta(b), rng(std::random_device{}()) {}
    
    void fit(const std::vector<int>& purchase_data, int iterations = 1000) {
        int n = purchase_data.size();
        double sum_purchases = std::accumulate(purchase_data.begin(), purchase_data.end(), 0.0);
        
        for (int i = 0; i < iterations; ++i) {
            alpha = (alpha + sum_purchases) / (1.0 + n / beta);
            beta = (beta + n) / (alpha + sum_purchases / n);
        }
    }
    
    std::vector<int> predictDemand(int n_samples = 1000) {
        std::gamma_distribution<double> gamma_dist(alpha, 1.0 / beta);
        std::vector<int> predictions;
        predictions.reserve(n_samples);
        
        for (int i = 0; i < n_samples; ++i) {
            double lambda = gamma_dist(rng);
            std::poisson_distribution<int> poisson_dist(lambda);
            predictions.push_back(poisson_dist(rng));
        }
        
        return predictions;
    }
    
    double getMean() const { return alpha / beta; }
    double getVariance() const { return alpha / (beta * beta); }
    double getAlpha() const { return alpha; }
    double getBeta() const { return beta; }
};

class ElasticityCalculator {
private:
    std::map<std::string, double> elasticity_coefficients;
    std::map<std::string, double> base_demand;
    
    double logRegression(const std::vector<double>& x, const std::vector<double>& y) {
        std::vector<double> log_x, log_y;
        for (size_t i = 0; i < x.size(); ++i) {
            log_x.push_back(std::log(x[i] + 1e-10));
            log_y.push_back(std::log(y[i] + 1e-10));
        }
        
        double sum_x = std::accumulate(log_x.begin(), log_x.end(), 0.0);
        double sum_y = std::accumulate(log_y.begin(), log_y.end(), 0.0);
        double sum_xy = 0.0, sum_xx = 0.0;
        
        for (size_t i = 0; i < log_x.size(); ++i) {
            sum_xy += log_x[i] * log_y[i];
            sum_xx += log_x[i] * log_x[i];
        }
        
        int n = log_x.size();
        return (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    }
    
public:
    double calculateElasticity(const std::vector<double>& prices, 
                              const std::vector<double>& quantities,
                              const std::string& product_id) {
        double elasticity = logRegression(prices, quantities);
        elasticity_coefficients[product_id] = elasticity;
        
        double sum = std::accumulate(quantities.begin(), quantities.end(), 0.0);
        base_demand[product_id] = sum / quantities.size();
        
        return elasticity;
    }
    
    double predictDemand(double current_price, double new_price, 
                        const std::string& product_id) const {
        auto it = elasticity_coefficients.find(product_id);
        if (it == elasticity_coefficients.end()) {
            auto bd_it = base_demand.find(product_id);
            return (bd_it != base_demand.end()) ? bd_it->second : 0.0;
        }
        
        double elasticity = it->second;
        double price_ratio = new_price / current_price;
        double demand_change = std::pow(price_ratio, elasticity);
        
        return base_demand.at(product_id) * demand_change;
    }
    
    double getElasticity(const std::string& product_id) const {
        auto it = elasticity_coefficients.find(product_id);
        return (it != elasticity_coefficients.end()) ? it->second : 0.0;
    }
};

struct OptimizationResult {
    double optimal_price;
    double expected_demand;
    double expected_revenue;
    double revenue_lift_percent;
};

class PriceOptimizer {
private:
    ElasticityCalculator elasticity_calc;
    
    double objectiveFunction(double price, double cost, double current_price,
                            const std::string& product_id) const {
        double demand = elasticity_calc.predictDemand(current_price, price, product_id);
        return (price - cost) * demand;
    }
    
    double goldenSectionSearch(double a, double b, double cost, 
                              double current_price, const std::string& product_id,
                              double tolerance = 1e-5) const {
        const double phi = (1.0 + std::sqrt(5.0)) / 2.0;
        const double resphi = 2.0 - phi;
        
        double x1 = a + resphi * (b - a);
        double x2 = b - resphi * (b - a);
        double f1 = -objectiveFunction(x1, cost, current_price, product_id);
        double f2 = -objectiveFunction(x2, cost, current_price, product_id);
        
        while (std::abs(b - a) > tolerance) {
            if (f1 < f2) {
                b = x2;
                x2 = x1;
                f2 = f1;
                x1 = a + resphi * (b - a);
                f1 = -objectiveFunction(x1, cost, current_price, product_id);
            } else {
                a = x1;
                x1 = x2;
                f1 = f2;
                x2 = b - resphi * (b - a);
                f2 = -objectiveFunction(x2, cost, current_price, product_id);
            }
        }
        
        return (a + b) / 2.0;
    }
    
public:
    void trainElasticity(const std::string& product_id,
                        const std::vector<double>& prices,
                        const std::vector<double>& quantities) {
        elasticity_calc.calculateElasticity(prices, quantities, product_id);
    }
    
    OptimizationResult optimizePrice(const std::string& product_id,
                                    double current_price,
                                    double cost,
                                    const std::vector<double>& competitor_prices,
                                    int inventory_level,
                                    int target_inventory) {
        double min_comp = competitor_prices.empty() ? current_price * 0.8 :
                         *std::min_element(competitor_prices.begin(), competitor_prices.end());
        double max_comp = competitor_prices.empty() ? current_price * 1.2 :
                         *std::max_element(competitor_prices.begin(), competitor_prices.end());
        
        double inventory_factor = 1.0;
        if (inventory_level > target_inventory * 1.2) {
            inventory_factor = 0.95;
        } else if (inventory_level < target_inventory * 0.8) {
            inventory_factor = 1.05;
        }
        
        double lower_bound = std::max(cost * 1.1, min_comp * 0.95 * inventory_factor);
        double upper_bound = std::min(current_price * 1.5, max_comp * 1.05 * inventory_factor);
        
        double optimal_price = goldenSectionSearch(lower_bound, upper_bound, cost,
                                                   current_price, product_id);
        
        double expected_demand = elasticity_calc.predictDemand(current_price, 
                                                               optimal_price, product_id);
        double expected_revenue = (optimal_price - cost) * expected_demand;
        
        double current_demand = elasticity_calc.predictDemand(current_price, 
                                                              current_price, product_id);
        double current_revenue = (current_price - cost) * current_demand;
        double revenue_lift = ((expected_revenue - current_revenue) / current_revenue) * 100.0;
        
        return {optimal_price, expected_demand, expected_revenue, revenue_lift};
    }
    
    double getElasticity(const std::string& product_id) const {
        return elasticity_calc.getElasticity(product_id);
    }
};

class BayesianOptimizer {
private:
    struct Point {
        std::vector<double> x;
        double y;
    };
    
    std::vector<Point> observations;
    std::vector<std::pair<double, double>> bounds;
    std::mt19937 rng;
    
    double expectedImprovement(const std::vector<double>& x, double best_y) {
        double mu = 0.0;
        double sigma = 1.0;
        
        for (const auto& obs : observations) {
            double dist = 0.0;
            for (size_t i = 0; i < x.size(); ++i) {
                dist += (x[i] - obs.x[i]) * (x[i] - obs.x[i]);
            }
            dist = std::sqrt(dist);
            
            double kernel = std::exp(-0.5 * dist);
            mu += kernel * obs.y;
            sigma *= (1.0 - kernel * 0.1);
        }
        
        if (!observations.empty()) {
            mu /= observations.size();
            sigma = std::max(sigma, 0.01);
        }
        
        double z = (mu - best_y) / sigma;
        double phi = 0.5 * (1.0 + std::erf(z / std::sqrt(2.0)));
        double pdf = std::exp(-0.5 * z * z) / std::sqrt(2.0 * M_PI);
        
        return (mu - best_y) * phi + sigma * pdf;
    }
    
public:
    BayesianOptimizer(const std::vector<std::pair<double, double>>& b)
        : bounds(b), rng(std::random_device{}()) {}
    
    std::vector<double> proposeNext() {
        if (observations.size() < 5) {
            std::vector<double> x;
            for (const auto& bound : bounds) {
                std::uniform_real_distribution<double> dist(bound.first, bound.second);
                x.push_back(dist(rng));
            }
            return x;
        }
        
        double best_y = observations.empty() ? 0.0 : 
                       std::max_element(observations.begin(), observations.end(),
                                      [](const Point& a, const Point& b) { 
                                          return a.y < b.y; 
                                      })->y;
        
        std::vector<double> best_x;
        double best_ei = -std::numeric_limits<double>::infinity();
        
        for (int i = 0; i < 100; ++i) {
            std::vector<double> x;
            for (const auto& bound : bounds) {
                std::uniform_real_distribution<double> dist(bound.first, bound.second);
                x.push_back(dist(rng));
            }
            
            double ei = expectedImprovement(x, best_y);
            if (ei > best_ei) {
                best_ei = ei;
                best_x = x;
            }
        }
        
        return best_x;
    }
    
    void update(const std::vector<double>& x, double y) {
        observations.push_back({x, y});
    }
    
    std::pair<std::vector<double>, double> getBest() const {
        if (observations.empty()) {
            return {{}, 0.0};
        }
        
        auto best = std::max_element(observations.begin(), observations.end(),
                                    [](const Point& a, const Point& b) { 
                                        return a.y < b.y; 
                                    });
        return {best->x, best->y};
    }
};

int main() {
    std::cout << "=== Dynamic Pricing Engine - C++ Optimizer ===" << std::endl << std::endl;
    
    GammaPoissonModel gp_model(2.0, 1.0);
    std::vector<int> purchase_history = {12, 15, 18, 14, 16, 13, 17, 15, 14, 16};
    gp_model.fit(purchase_history);
    
    std::cout << "Gamma-Poisson Model:" << std::endl;
    std::cout << "  Alpha: " << gp_model.getAlpha() << std::endl;
    std::cout << "  Beta: " << gp_model.getBeta() << std::endl;
    std::cout << "  Mean Demand: " << gp_model.getMean() << std::endl;
    std::cout << "  Variance: " << gp_model.getVariance() << std::endl << std::endl;
    
    PriceOptimizer optimizer;
    std::vector<double> prices = {20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40};
    std::vector<double> quantities;
    for (double p : prices) {
        quantities.push_back(2000 - 30 * p + (std::rand() % 100 - 50));
    }
    
    std::string product_id = "PROD001";
    optimizer.trainElasticity(product_id, prices, quantities);
    
    std::cout << "Price Elasticity: " << optimizer.getElasticity(product_id) << std::endl << std::endl;
    
    std::vector<double> competitor_prices = {33.0, 37.0, 36.5};
    OptimizationResult result = optimizer.optimizePrice(
        product_id, 35.0, 20.0, competitor_prices, 450, 400
    );
    
    std::cout << "Price Optimization Results:" << std::endl;
    std::cout << "  Optimal Price: $" << result.optimal_price << std::endl;
    std::cout << "  Expected Demand: " << result.expected_demand << std::endl;
    std::cout << "  Expected Revenue: $" << result.expected_revenue << std::endl;
    std::cout << "  Revenue Lift: " << result.revenue_lift_percent << "%" << std::endl << std::endl;
    
    BayesianOptimizer bayes_opt({{20.0, 50.0}});
    auto objective = [](const std::vector<double>& x) {
        return -(x[0] - 32.5) * (x[0] - 32.5) + 150.0;
    };
    
    for (int i = 0; i < 15; ++i) {
        std::vector<double> x_next = bayes_opt.proposeNext();
        double y_next = objective(x_next);
        bayes_opt.update(x_next, y_next);
    }
    
    auto [best_params, best_value] = bayes_opt.getBest();
    std::cout << "Bayesian Optimization Results:" << std::endl;
    std::cout << "  Best Price: $" << best_params[0] << std::endl;
    std::cout << "  Best Objective Value: " << best_value << std::endl;
    
    return 0;
}