import java.util.*;
import java.util.stream.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.io.*;
import java.nio.file.*;
import com.google.gson.*;

public class PricingService {
    
    private Map<String, Product> productCatalog;
    private Map<String, List<PriceHistory>> priceHistory;
    private Map<String, ElasticityModel> elasticityModels;
    private ABTestManager abTestManager;
    private OptimizationEngine optimizationEngine;
    
    public PricingService() {
        this.productCatalog = new HashMap<>();
        this.priceHistory = new HashMap<>();
        this.elasticityModels = new HashMap<>();
        this.abTestManager = new ABTestManager();
        this.optimizationEngine = new OptimizationEngine();
        initializeSampleData();
    }
    
    private void initializeSampleData() {
        productCatalog.put("PROD001", new Product("PROD001", "Premium Widget", 29.99, 15.50, 450, "Electronics"));
        productCatalog.put("PROD002", new Product("PROD002", "Standard Gadget", 49.99, 28.00, 320, "Electronics"));
        productCatalog.put("PROD003", new Product("PROD003", "Budget Device", 19.99, 10.00, 890, "Accessories"));
    }
    
    public OptimizationResult optimizePrice(String productId, List<Double> competitorPrices, 
                                           int targetInventory) {
        Product product = productCatalog.get(productId);
        if (product == null) {
            throw new IllegalArgumentException("Product not found: " + productId);
        }
        
        ElasticityModel model = elasticityModels.getOrDefault(productId, 
                                                             new ElasticityModel(-1.8, 1200.0));
        
        double avgCompetitorPrice = competitorPrices.isEmpty() ? product.currentPrice : 
                                   competitorPrices.stream().mapToDouble(Double::doubleValue).average().orElse(product.currentPrice);
        
        double inventoryFactor = 1.0;
        if (product.inventory > targetInventory * 1.2) {
            inventoryFactor = 0.95;
        } else if (product.inventory < targetInventory * 0.8) {
            inventoryFactor = 1.05;
        }
        
        double competitiveFactor = avgCompetitorPrice / product.currentPrice;
        double optimalPrice = product.currentPrice * competitiveFactor * inventoryFactor;
        optimalPrice = Math.max(product.cost * 1.2, Math.min(optimalPrice, product.currentPrice * 1.3));
        
        double priceChange = optimalPrice / product.currentPrice;
        double demandChange = Math.pow(priceChange, model.elasticity);
        double expectedDemand = model.baseDemand * demandChange;
        
        double expectedRevenue = (optimalPrice - product.cost) * expectedDemand;
        double currentRevenue = (product.currentPrice - product.cost) * model.baseDemand;
        double revenueLift = ((expectedRevenue - currentRevenue) / currentRevenue) * 100;
        
        OptimizationResult result = new OptimizationResult(
            productId,
            product.currentPrice,
            optimalPrice,
            expectedDemand,
            expectedRevenue,
            revenueLift,
            LocalDateTime.now()
        );
        
        recordPriceHistory(productId, optimalPrice, expectedDemand, expectedRevenue);
        
        return result;
    }
    
    public void trainElasticityModel(String productId, List<Double> prices, List<Double> quantities) {
        if (prices.size() != quantities.size() || prices.isEmpty()) {
            throw new IllegalArgumentException("Prices and quantities must have the same non-zero length");
        }
        
        List<Double> logPrices = prices.stream().map(p -> Math.log(p + 1e-10)).collect(Collectors.toList());
        List<Double> logQuantities = quantities.stream().map(q -> Math.log(q + 1e-10)).collect(Collectors.toList());
        
        double elasticity = calculateLinearRegression(logPrices, logQuantities);
        double baseDemand = quantities.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        
        elasticityModels.put(productId, new ElasticityModel(elasticity, baseDemand));
        
        System.out.printf("Trained elasticity model for %s: %.4f%n", productId, elasticity);
    }
    
    private double calculateLinearRegression(List<Double> x, List<Double> y) {
        int n = x.size();
        double sumX = x.stream().mapToDouble(Double::doubleValue).sum();
        double sumY = y.stream().mapToDouble(Double::doubleValue).sum();
        double sumXY = IntStream.range(0, n).mapToDouble(i -> x.get(i) * y.get(i)).sum();
        double sumXX = x.stream().mapToDouble(v -> v * v).sum();
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }
    
    public ABTestResult createABTest(String productId, Map<String, ABVariant> variants, int duration) {
        return abTestManager.createTest(productId, variants, duration);
    }
    
    public ABTestResult updateABTest(String testId, String variantName, int conversions, int impressions) {
        return abTestManager.updateTest(testId, variantName, conversions, impressions);
    }
    
    public Map<String, Double> getABTestWinner(String testId) {
        return abTestManager.calculateWinner(testId);
    }
    
    public void recordPriceHistory(String productId, double price, double demand, double revenue) {
        priceHistory.computeIfAbsent(productId, k -> new ArrayList<>())
                   .add(new PriceHistory(LocalDateTime.now(), price, demand, revenue));
    }
    
    public List<PriceHistory> getPriceHistory(String productId) {
        return priceHistory.getOrDefault(productId, new ArrayList<>());
    }
    
    public RevenueMetrics calculateRevenueMetrics() {
        double totalRevenue = priceHistory.values().stream()
            .flatMap(List::stream)
            .mapToDouble(ph -> ph.revenue)
            .sum();
        
        double totalUnits = priceHistory.values().stream()
            .flatMap(List::stream)
            .mapToDouble(ph -> ph.demand)
            .sum();
        
        double avgOrderValue = totalRevenue / Math.max(totalUnits, 1);
        
        return new RevenueMetrics(totalRevenue, totalUnits, avgOrderValue, LocalDateTime.now());
    }
    
    public String exportToJson() {
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        
        Map<String, Object> export = new HashMap<>();
        export.put("products", productCatalog);
        export.put("elasticity_models", elasticityModels);
        export.put("price_history", priceHistory);
        export.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
        
        return gson.toJson(export);
    }
    
    public void saveToFile(String filename) throws IOException {
        String json = exportToJson();
        Files.write(Paths.get(filename), json.getBytes());
        System.out.println("Data saved to: " + filename);
    }
    
    static class Product {
        String productId;
        String name;
        double currentPrice;
        double cost;
        int inventory;
        String category;
        
        Product(String productId, String name, double currentPrice, double cost, int inventory, String category) {
            this.productId = productId;
            this.name = name;
            this.currentPrice = currentPrice;
            this.cost = cost;
            this.inventory = inventory;
            this.category = category;
        }
    }
    
    static class ElasticityModel {
        double elasticity;
        double baseDemand;
        
        ElasticityModel(double elasticity, double baseDemand) {
            this.elasticity = elasticity;
            this.baseDemand = baseDemand;
        }
    }
    
    static class PriceHistory {
        LocalDateTime timestamp;
        double price;
        double demand;
        double revenue;
        
        PriceHistory(LocalDateTime timestamp, double price, double demand, double revenue) {
            this.timestamp = timestamp;
            this.price = price;
            this.demand = demand;
            this.revenue = revenue;
        }
    }
    
    static class OptimizationResult {
        String productId;
        double currentPrice;
        double optimalPrice;
        double expectedDemand;
        double expectedRevenue;
        double revenueLiftPercent;
        LocalDateTime timestamp;
        
        OptimizationResult(String productId, double currentPrice, double optimalPrice, 
                          double expectedDemand, double expectedRevenue, double revenueLiftPercent,
                          LocalDateTime timestamp) {
            this.productId = productId;
            this.currentPrice = currentPrice;
            this.optimalPrice = optimalPrice;
            this.expectedDemand = expectedDemand;
            this.expectedRevenue = expectedRevenue;
            this.revenueLiftPercent = revenueLiftPercent;
            this.timestamp = timestamp;
        }
        
        @Override
        public String toString() {
            return String.format("Optimization Result for %s:%n" +
                               "  Current Price: $%.2f%n" +
                               "  Optimal Price: $%.2f%n" +
                               "  Expected Demand: %.0f%n" +
                               "  Expected Revenue: $%.2f%n" +
                               "  Revenue Lift: %.2f%%%n",
                               productId, currentPrice, optimalPrice, expectedDemand, 
                               expectedRevenue, revenueLiftPercent);
        }
    }
    
    static class ABVariant {
        double price;
        int conversions;
        int impressions;
        
        ABVariant(double price, int conversions, int impressions) {
            this.price = price;
            this.conversions = conversions;
            this.impressions = impressions;
        }
        
        double getConversionRate() {
            return impressions > 0 ? (double) conversions / impressions : 0.0;
        }
    }
    
    static class ABTestResult {
        String testId;
        String productId;
        Map<String, ABVariant> variants;
        String status;
        LocalDateTime createdAt;
        
        ABTestResult(String testId, String productId, Map<String, ABVariant> variants, String status) {
            this.testId = testId;
            this.productId = productId;
            this.variants = variants;
            this.status = status;
            this.createdAt = LocalDateTime.now();
        }
    }
    
    static class RevenueMetrics {
        double totalRevenue;
        double totalUnits;
        double avgOrderValue;
        LocalDateTime timestamp;
        
        RevenueMetrics(double totalRevenue, double totalUnits, double avgOrderValue, LocalDateTime timestamp) {
            this.totalRevenue = totalRevenue;
            this.totalUnits = totalUnits;
            this.avgOrderValue = avgOrderValue;
            this.timestamp = timestamp;
        }
    }
    
    static class ABTestManager {
        private Map<String, ABTestResult> activeTests = new HashMap<>();
        private Random random = new Random();
        
        ABTestResult createTest(String productId, Map<String, ABVariant> variants, int duration) {
            String testId = "TEST" + String.format("%03d", random.nextInt(1000));
            ABTestResult test = new ABTestResult(testId, productId, variants, "running");
            activeTests.put(testId, test);
            return test;
        }
        
        ABTestResult updateTest(String testId, String variantName, int conversions, int impressions) {
            ABTestResult test = activeTests.get(testId);
            if (test != null && test.variants.containsKey(variantName)) {
                ABVariant variant = test.variants.get(variantName);
                variant.conversions += conversions;
                variant.impressions += impressions;
            }
            return test;
        }
        
        Map<String, Double> calculateWinner(String testId) {
            ABTestResult test = activeTests.get(testId);
            if (test == null) {
                return new HashMap<>();
            }
            
            Map<String, Double> probabilities = new HashMap<>();
            double totalScore = 0.0;
            
            for (Map.Entry<String, ABVariant> entry : test.variants.entrySet()) {
                double score = entry.getValue().getConversionRate() * 100;
                probabilities.put(entry.getKey(), score);
                totalScore += score;
            }
            
            if (totalScore > 0) {
                probabilities.replaceAll((k, v) -> v / totalScore);
            }
            
            return probabilities;
        }
    }
    
    static class OptimizationEngine {
        private Random random = new Random();
        
        public double[] bayesianOptimization(OptimizationObjective objective, 
                                            double lowerBound, double upperBound, 
                                            int iterations) {
            List<Double> observations = new ArrayList<>();
            List<Double> values = new ArrayList<>();
            
            for (int i = 0; i < Math.min(5, iterations); i++) {
                double x = lowerBound + random.nextDouble() * (upperBound - lowerBound);
                observations.add(x);
                values.add(objective.evaluate(x));
            }
            
            for (int i = 5; i < iterations; i++) {
                double xNext = proposeNext(observations, values, lowerBound, upperBound);
                double yNext = objective.evaluate(xNext);
                observations.add(xNext);
                values.add(yNext);
            }
            
            int bestIdx = IntStream.range(0, values.size())
                .reduce((i, j) -> values.get(i) > values.get(j) ? i : j)
                .orElse(0);
            
            return new double[]{observations.get(bestIdx), values.get(bestIdx)};
        }
        
        private double proposeNext(List<Double> observations, List<Double> values, 
                                  double lowerBound, double upperBound) {
            double bestX = lowerBound + random.nextDouble() * (upperBound - lowerBound);
            double bestEI = 0.0;
            
            for (int i = 0; i < 100; i++) {
                double x = lowerBound + random.nextDouble() * (upperBound - lowerBound);
                double ei = calculateExpectedImprovement(x, observations, values);
                if (ei > bestEI) {
                    bestEI = ei;
                    bestX = x;
                }
            }
            
            return bestX;
        }
        
        private double calculateExpectedImprovement(double x, List<Double> observations, 
                                                    List<Double> values) {
            double bestY = values.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
            return Math.max(0, x - bestY);
        }
    }
    
    @FunctionalInterface
    interface OptimizationObjective {
        double evaluate(double x);
    }
    
    public static void main(String[] args) {
        System.out.println("=== Dynamic Pricing Service - Java Implementation ===\n");
        
        PricingService service = new PricingService();
        
        List<Double> prices = IntStream.rangeClosed(20, 40)
            .mapToDouble(i -> (double) i)
            .boxed()
            .collect(Collectors.toList());
        
        List<Double> quantities = prices.stream()
            .map(p -> 2000 - 30 * p + (Math.random() * 100 - 50))
            .collect(Collectors.toList());
        
        service.trainElasticityModel("PROD001", prices, quantities);
        
        List<Double> competitorPrices = Arrays.asList(33.0, 37.0, 36.5);
        OptimizationResult result = service.optimizePrice("PROD001", competitorPrices, 400);
        System.out.println("\n" + result);
        
        Map<String, ABVariant> variants = new HashMap<>();
        variants.put("control", new ABVariant(29.99, 180, 5000));
        variants.put("variant_a", new ABVariant(27.99, 210, 5000));
        variants.put("variant_b", new ABVariant(28.49, 195, 5000));
        
        ABTestResult abTest = service.createABTest("PROD001", variants, 14);
        System.out.println("Created A/B Test: " + abTest.testId);
        
        Map<String, Double> winner = service.getABTestWinner(abTest.testId);
        System.out.println("\nA/B Test Probabilities:");
        winner.forEach((variant, prob) -> 
            System.out.printf("  %s: %.2f%%%n", variant, prob * 100));
        
        RevenueMetrics metrics = service.calculateRevenueMetrics();
        System.out.printf("%nRevenue Metrics:%n");
        System.out.printf("  Total Revenue: $%.2f%n", metrics.totalRevenue);
        System.out.printf("  Total Units: %.0f%n", metrics.totalUnits);
        System.out.printf("  Avg Order Value: $%.2f%n", metrics.avgOrderValue);
        
        try {
            service.saveToFile("pricing_service_export.json");
        } catch (IOException e) {
            System.err.println("Error saving file: " + e.getMessage());
        }
        
        System.out.println("\n=== Service Initialization Complete ===");
    }
}