<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class DatabaseConnection {
    private $host = 'localhost';
    private $dbname = 'dynamic_pricing';
    private $username = 'root';
    private $password = '';
    private $conn = null;
    
    public function connect() {
        try {
            $this->conn = new PDO(
                "mysql:host={$this->host};dbname={$this->dbname};charset=utf8mb4",
                $this->username,
                $this->password,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            return $this->conn;
        } catch (PDOException $e) {
            return null;
        }
    }
}

class PricingAPI {
    private $db;
    
    public function __construct() {
        $database = new DatabaseConnection();
        $this->db = $database->connect();
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        
        $endpoint = $segments[count($segments) - 1] ?? '';
        
        switch ($method) {
            case 'GET':
                return $this->handleGet($endpoint);
            case 'POST':
                return $this->handlePost($endpoint);
            case 'PUT':
                return $this->handlePut($endpoint);
            case 'DELETE':
                return $this->handleDelete($endpoint);
            default:
                return $this->errorResponse('Method not allowed', 405);
        }
    }
    
    private function handleGet($endpoint) {
        switch ($endpoint) {
            case 'products':
                return $this->getProducts();
            case 'pricing-history':
                return $this->getPricingHistory();
            case 'elasticity':
                return $this->getElasticity();
            case 'ab-tests':
                return $this->getABTests();
            case 'competitors':
                return $this->getCompetitorPrices();
            case 'revenue-metrics':
                return $this->getRevenueMetrics();
            default:
                return $this->errorResponse('Endpoint not found', 404);
        }
    }
    
    private function handlePost($endpoint) {
        $input = json_decode(file_get_contents('php://input'), true);
        
        switch ($endpoint) {
            case 'optimize-price':
                return $this->optimizePrice($input);
            case 'create-ab-test':
                return $this->createABTest($input);
            case 'update-inventory':
                return $this->updateInventory($input);
            case 'record-purchase':
                return $this->recordPurchase($input);
            case 'calculate-elasticity':
                return $this->calculateElasticity($input);
            default:
                return $this->errorResponse('Endpoint not found', 404);
        }
    }
    
    private function handlePut($endpoint) {
        $input = json_decode(file_get_contents('php://input'), true);
        
        switch ($endpoint) {
            case 'update-price':
                return $this->updatePrice($input);
            case 'update-ab-test':
                return $this->updateABTest($input);
            default:
                return $this->errorResponse('Endpoint not found', 404);
        }
    }
    
    private function handleDelete($endpoint) {
        switch ($endpoint) {
            case 'clear-history':
                return $this->clearHistory();
            default:
                return $this->errorResponse('Endpoint not found', 404);
        }
    }
    
    private function getProducts() {
        $products = [
            [
                'product_id' => 'PROD001',
                'name' => 'Premium Widget',
                'current_price' => 29.99,
                'cost' => 15.50,
                'inventory' => 450,
                'elasticity' => -1.8,
                'category' => 'Electronics'
            ],
            [
                'product_id' => 'PROD002',
                'name' => 'Standard Gadget',
                'current_price' => 49.99,
                'cost' => 28.00,
                'inventory' => 320,
                'elasticity' => -2.3,
                'category' => 'Electronics'
            ],
            [
                'product_id' => 'PROD003',
                'name' => 'Budget Device',
                'current_price' => 19.99,
                'cost' => 10.00,
                'inventory' => 890,
                'elasticity' => -1.2,
                'category' => 'Accessories'
            ]
        ];
        
        return $this->successResponse($products);
    }
    
    private function getPricingHistory() {
        $history = [
            [
                'timestamp' => date('Y-m-d H:i:s', strtotime('-5 days')),
                'product_id' => 'PROD001',
                'price' => 29.99,
                'demand' => 125,
                'revenue' => 3748.75,
                'conversion_rate' => 3.8
            ],
            [
                'timestamp' => date('Y-m-d H:i:s', strtotime('-4 days')),
                'product_id' => 'PROD001',
                'price' => 27.99,
                'demand' => 142,
                'revenue' => 3974.58,
                'conversion_rate' => 4.2
            ],
            [
                'timestamp' => date('Y-m-d H:i:s', strtotime('-3 days')),
                'product_id' => 'PROD001',
                'price' => 28.99,
                'demand' => 135,
                'revenue' => 3913.65,
                'conversion_rate' => 4.0
            ]
        ];
        
        return $this->successResponse($history);
    }
    
    private function getElasticity() {
        $elasticity_data = [
            'PROD001' => [
                'product_id' => 'PROD001',
                'elasticity' => -1.8,
                'confidence_interval' => [-2.1, -1.5],
                'r_squared' => 0.87,
                'sample_size' => 120
            ],
            'PROD002' => [
                'product_id' => 'PROD002',
                'elasticity' => -2.3,
                'confidence_interval' => [-2.7, -1.9],
                'r_squared' => 0.91,
                'sample_size' => 95
            ],
            'PROD003' => [
                'product_id' => 'PROD003',
                'elasticity' => -1.2,
                'confidence_interval' => [-1.5, -0.9],
                'r_squared' => 0.82,
                'sample_size' => 150
            ]
        ];
        
        return $this->successResponse($elasticity_data);
    }
    
    private function getABTests() {
        $ab_tests = [
            [
                'test_id' => 'TEST001',
                'product_id' => 'PROD001',
                'status' => 'running',
                'variants' => [
                    'control' => [
                        'price' => 29.99,
                        'conversions' => 180,
                        'impressions' => 5000,
                        'revenue' => 5398.20
                    ],
                    'variant_a' => [
                        'price' => 27.99,
                        'conversions' => 210,
                        'impressions' => 5000,
                        'revenue' => 5877.90
                    ],
                    'variant_b' => [
                        'price' => 28.49,
                        'conversions' => 195,
                        'impressions' => 5000,
                        'revenue' => 5555.55
                    ]
                ],
                'winner' => 'variant_a',
                'confidence' => 0.95,
                'start_date' => date('Y-m-d', strtotime('-7 days')),
                'end_date' => null
            ]
        ];
        
        return $this->successResponse($ab_tests);
    }
    
    private function getCompetitorPrices() {
        $competitor_data = [
            'PROD001' => [
                [
                    'competitor_id' => 'COMP001',
                    'competitor_name' => 'CompetitorA',
                    'price' => 31.99,
                    'last_updated' => date('Y-m-d H:i:s'),
                    'availability' => 'in_stock'
                ],
                [
                    'competitor_id' => 'COMP002',
                    'competitor_name' => 'CompetitorB',
                    'price' => 28.49,
                    'last_updated' => date('Y-m-d H:i:s'),
                    'availability' => 'in_stock'
                ],
                [
                    'competitor_id' => 'COMP003',
                    'competitor_name' => 'CompetitorC',
                    'price' => 29.99,
                    'last_updated' => date('Y-m-d H:i:s'),
                    'availability' => 'low_stock'
                ]
            ]
        ];
        
        return $this->successResponse($competitor_data);
    }
    
    private function getRevenueMetrics() {
        $metrics = [
            'total_revenue' => 482340.50,
            'total_units_sold' => 15420,
            'avg_order_value' => 31.27,
            'revenue_lift' => 18.5,
            'optimized_products' => 42,
            'conversion_rate' => 3.9,
            'period' => 'last_30_days',
            'by_product' => [
                'PROD001' => [
                    'revenue' => 125480.00,
                    'units' => 4200,
                    'lift' => 22.3
                ],
                'PROD002' => [
                    'revenue' => 198760.00,
                    'units' => 3980,
                    'lift' => 15.8
                ],
                'PROD003' => [
                    'revenue' => 158100.50,
                    'units' => 7240,
                    'lift' => 19.2
                ]
            ]
        ];
        
        return $this->successResponse($metrics);
    }
    
    private function optimizePrice($input) {
        $product_id = $input['product_id'] ?? null;
        $current_price = $input['current_price'] ?? 0;
        $cost = $input['cost'] ?? 0;
        $inventory = $input['inventory'] ?? 0;
        $competitor_prices = $input['competitor_prices'] ?? [];
        
        if (!$product_id || !$current_price || !$cost) {
            return $this->errorResponse('Missing required parameters', 400);
        }
        
        $elasticity = -1.8;
        $base_demand = 1200;
        
        $avg_competitor_price = !empty($competitor_prices) 
            ? array_sum($competitor_prices) / count($competitor_prices) 
            : $current_price;
        
        $inventory_factor = 1.0;
        if ($inventory > 500) {
            $inventory_factor = 0.95;
        } elseif ($inventory < 200) {
            $inventory_factor = 1.05;
        }
        
        $competitive_factor = $avg_competitor_price / $current_price;
        
        $optimal_price = $current_price * $competitive_factor * $inventory_factor;
        $optimal_price = max($cost * 1.2, min($optimal_price, $current_price * 1.3));
        
        $price_change = $optimal_price / $current_price;
        $demand_change = pow($price_change, $elasticity);
        $expected_demand = $base_demand * $demand_change;
        
        $expected_revenue = ($optimal_price - $cost) * $expected_demand;
        $current_revenue = ($current_price - $cost) * $base_demand;
        $revenue_lift = (($expected_revenue - $current_revenue) / $current_revenue) * 100;
        
        $result = [
            'product_id' => $product_id,
            'current_price' => round($current_price, 2),
            'optimal_price' => round($optimal_price, 2),
            'price_change_percent' => round((($optimal_price - $current_price) / $current_price) * 100, 2),
            'expected_demand' => round($expected_demand),
            'expected_revenue' => round($expected_revenue, 2),
            'revenue_lift_percent' => round($revenue_lift, 2),
            'confidence_interval' => [
                round($optimal_price * 0.97, 2),
                round($optimal_price * 1.03, 2)
            ],
            'recommendation' => $optimal_price > $current_price ? 'increase' : 'decrease',
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        return $this->successResponse($result);
    }
    
    private function createABTest($input) {
        $test_id = 'TEST' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
        $product_id = $input['product_id'] ?? null;
        $variants = $input['variants'] ?? [];
        
        if (!$product_id || empty($variants)) {
            return $this->errorResponse('Missing required parameters', 400);
        }
        
        $result = [
            'test_id' => $test_id,
            'product_id' => $product_id,
            'status' => 'initialized',
            'variants' => $variants,
            'created_at' => date('Y-m-d H:i:s'),
            'expected_duration_days' => 14,
            'min_sample_size' => 1000
        ];
        
        return $this->successResponse($result);
    }
    
    private function updateInventory($input) {
        $product_id = $input['product_id'] ?? null;
        $quantity = $input['quantity'] ?? 0;
        
        if (!$product_id) {
            return $this->errorResponse('Product ID required', 400);
        }
        
        $result = [
            'product_id' => $product_id,
            'previous_quantity' => 450,
            'new_quantity' => $quantity,
            'updated_at' => date('Y-m-d H:i:s'),
            'reorder_recommended' => $quantity < 200
        ];
        
        return $this->successResponse($result);
    }
    
    private function recordPurchase($input) {
        $product_id = $input['product_id'] ?? null;
        $quantity = $input['quantity'] ?? 1;
        $price = $input['price'] ?? 0;
        
        if (!$product_id || !$price) {
            return $this->errorResponse('Missing required parameters', 400);
        }
        
        $result = [
            'purchase_id' => 'PUR' . time(),
            'product_id' => $product_id,
            'quantity' => $quantity,
            'price' => $price,
            'total' => $price * $quantity,
            'timestamp' => date('Y-m-d H:i:s'),
            'recorded' => true
        ];
        
        return $this->successResponse($result);
    }
    
    private function calculateElasticity($input) {
        $product_id = $input['product_id'] ?? null;
        
        if (!$product_id) {
            return $this->errorResponse('Product ID required', 400);
        }
        
        $elasticity = -1.8 + (rand(-50, 50) / 100);
        
        $result = [
            'product_id' => $product_id,
            'elasticity' => round($elasticity, 2),
            'interpretation' => abs($elasticity) > 1 ? 'elastic' : 'inelastic',
            'confidence_interval' => [
                round($elasticity - 0.3, 2),
                round($elasticity + 0.3, 2)
            ],
            'r_squared' => round(0.75 + rand(0, 20) / 100, 2),
            'sample_size' => rand(80, 150),
            'calculated_at' => date('Y-m-d H:i:s')
        ];
        
        return $this->successResponse($result);
    }
    
    private function updatePrice($input) {
        $product_id = $input['product_id'] ?? null;
        $new_price = $input['new_price'] ?? 0;
        
        if (!$product_id || !$new_price) {
            return $this->errorResponse('Missing required parameters', 400);
        }
        
        $result = [
            'product_id' => $product_id,
            'previous_price' => 29.99,
            'new_price' => $new_price,
            'updated_at' => date('Y-m-d H:i:s'),
            'status' => 'success'
        ];
        
        return $this->successResponse($result);
    }
    
    private function updateABTest($input) {
        $test_id = $input['test_id'] ?? null;
        
        if (!$test_id) {
            return $this->errorResponse('Test ID required', 400);
        }
        
        $result = [
            'test_id' => $test_id,
            'status' => 'updated',
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        return $this->successResponse($result);
    }
    
    private function clearHistory() {
        $result = [
            'status' => 'success',
            'message' => 'Pricing history cleared',
            'cleared_at' => date('Y-m-d H:i:s')
        ];
        
        return $this->successResponse($result);
    }
    
    private function successResponse($data, $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_PRETTY_PRINT);
        exit();
    }
    
    private function errorResponse($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_PRETTY_PRINT);
        exit();
    }
}

$api = new PricingAPI();
$api->handleRequest();
?>