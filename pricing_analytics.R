library(MASS)
library(ggplot2)
library(dplyr)
library(tidyr)
library(jsonlite)
library(forecast)
library(stats)

set_working_directory <- function() {
  if (!dir.exists("pricing_output")) {
    dir.create("pricing_output")
  }
  setwd(getwd())
}

gamma_poisson_analysis <- function(purchase_data, product_id = "PROD001") {
  cat("=== Gamma-Poisson Mixture Analysis ===\n")
  
  fit <- fitdistr(purchase_data, "negative binomial")
  
  size_param <- fit$estimate["size"]
  mu_param <- fit$estimate["mu"]
  
  alpha <- size_param
  beta <- size_param / mu_param
  
  theoretical_mean <- mu_param
  theoretical_var <- mu_param + (mu_param^2 / size_param)
  
  empirical_mean <- mean(purchase_data)
  empirical_var <- var(purchase_data)
  
  overdispersion_ratio <- empirical_var / empirical_mean
  
  cat(sprintf("\nProduct ID: %s\n", product_id))
  cat(sprintf("Alpha (shape): %.4f\n", alpha))
  cat(sprintf("Beta (rate): %.4f\n", beta))
  cat(sprintf("Theoretical Mean: %.4f\n", theoretical_mean))
  cat(sprintf("Empirical Mean: %.4f\n", empirical_mean))
  cat(sprintf("Theoretical Variance: %.4f\n", theoretical_var))
  cat(sprintf("Empirical Variance: %.4f\n", empirical_var))
  cat(sprintf("Overdispersion Ratio: %.4f\n", overdispersion_ratio))
  
  predictions <- rnbinom(1000, size = size_param, mu = mu_param)
  
  results <- list(
    alpha = alpha,
    beta = beta,
    mean = empirical_mean,
    variance = empirical_var,
    overdispersion = overdispersion_ratio,
    predictions = predictions,
    confidence_interval = quantile(predictions, probs = c(0.05, 0.95))
  )
  
  return(results)
}

calculate_price_elasticity <- function(prices, quantities, product_id = "PROD001") {
  cat("\n=== Price Elasticity Calculation ===\n")
  
  log_prices <- log(prices + 1e-10)
  log_quantities <- log(quantities + 1e-10)
  
  model <- lm(log_quantities ~ log_prices)
  elasticity <- coef(model)["log_prices"]
  
  r_squared <- summary(model)$r.squared
  std_error <- summary(model)$coefficients["log_prices", "Std. Error"]
  
  conf_interval <- confint(model, "log_prices", level = 0.95)
  
  cat(sprintf("\nProduct ID: %s\n", product_id))
  cat(sprintf("Price Elasticity: %.4f\n", elasticity))
  cat(sprintf("R-squared: %.4f\n", r_squared))
  cat(sprintf("Standard Error: %.4f\n", std_error))
  cat(sprintf("95%% Confidence Interval: [%.4f, %.4f]\n", 
              conf_interval[1], conf_interval[2]))
  
  interpretation <- ifelse(abs(elasticity) > 1, "Elastic", "Inelastic")
  cat(sprintf("Interpretation: %s demand\n", interpretation))
  
  elasticity_data <- data.frame(
    price = prices,
    quantity = quantities,
    fitted = exp(predict(model))
  )
  
  plot_elasticity <- ggplot(elasticity_data, aes(x = price)) +
    geom_point(aes(y = quantity), color = "#0088FE", size = 3) +
    geom_line(aes(y = fitted), color = "#FF8042", size = 1) +
    theme_minimal() +
    labs(title = sprintf("Price Elasticity Analysis - %s", product_id),
         subtitle = sprintf("Elasticity = %.2f (%s)", elasticity, interpretation),
         x = "Price ($)", y = "Quantity Demanded") +
    theme(plot.title = element_text(hjust = 0.5, face = "bold"),
          plot.subtitle = element_text(hjust = 0.5))
  
  ggsave(sprintf("pricing_output/elasticity_%s.png", product_id), 
         plot_elasticity, width = 8, height = 6)
  
  results <- list(
    elasticity = as.numeric(elasticity),
    r_squared = r_squared,
    std_error = std_error,
    confidence_interval = as.numeric(conf_interval),
    interpretation = interpretation,
    model = model
  )
  
  return(results)
}

bayesian_ab_test <- function(variants_data) {
  cat("\n=== Bayesian A/B Test Analysis ===\n")
  
  prior_alpha <- 1
  prior_beta <- 1
  
  results <- list()
  
  for (variant_name in names(variants_data)) {
    conversions <- variants_data[[variant_name]]$conversions
    trials <- variants_data[[variant_name]]$trials
    
    posterior_alpha <- prior_alpha + conversions
    posterior_beta <- prior_beta + trials - conversions
    
    posterior_mean <- posterior_alpha / (posterior_alpha + posterior_beta)
    
    results[[variant_name]] <- list(
      alpha = posterior_alpha,
      beta = posterior_beta,
      mean = posterior_mean,
      conversions = conversions,
      trials = trials,
      conversion_rate = conversions / trials
    )
    
    cat(sprintf("\n%s:\n", variant_name))
    cat(sprintf("  Conversions: %d / %d\n", conversions, trials))
    cat(sprintf("  Conversion Rate: %.2f%%\n", (conversions/trials) * 100))
    cat(sprintf("  Posterior Mean: %.4f\n", posterior_mean))
  }
  
  n_samples <- 10000
  samples <- list()
  
  for (variant_name in names(results)) {
    samples[[variant_name]] <- rbeta(n_samples, 
                                     results[[variant_name]]$alpha,
                                     results[[variant_name]]$beta)
  }
  
  prob_best <- sapply(names(samples), function(variant) {
    mean(samples[[variant]] == do.call(pmax, samples))
  })
  
  cat("\n\nProbability of Being Best:\n")
  for (variant_name in names(prob_best)) {
    cat(sprintf("  %s: %.2f%%\n", variant_name, prob_best[variant_name] * 100))
  }
  
  winner <- names(prob_best)[which.max(prob_best)]
  cat(sprintf("\nRecommended Winner: %s (%.2f%% confidence)\n", 
              winner, max(prob_best) * 100))
  
  samples_df <- as.data.frame(samples)
  samples_long <- pivot_longer(samples_df, cols = everything(), 
                               names_to = "Variant", values_to = "ConversionRate")
  
  plot_distributions <- ggplot(samples_long, aes(x = ConversionRate, fill = Variant)) +
    geom_density(alpha = 0.5) +
    scale_fill_manual(values = c("#0088FE", "#00C49F", "#FFBB28", "#FF8042")) +
    theme_minimal() +
    labs(title = "Bayesian A/B Test - Posterior Distributions",
         x = "Conversion Rate", y = "Density") +
    theme(plot.title = element_text(hjust = 0.5, face = "bold"))
  
  ggsave("pricing_output/ab_test_distributions.png", 
         plot_distributions, width = 10, height = 6)
  
  return(list(
    results = results,
    prob_best = prob_best,
    winner = winner,
    samples = samples
  ))
}

demand_forecasting <- function(historical_demand, forecast_periods = 14) {
  cat("\n=== Demand Forecasting ===\n")
  
  ts_data <- ts(historical_demand, frequency = 7)
  
  fit_arima <- auto.arima(ts_data)
  
  forecast_result <- forecast(fit_arima, h = forecast_periods)
  
  cat(sprintf("\nModel: %s\n", arima_string(fit_arima)))
  cat(sprintf("AIC: %.2f\n", AIC(fit_arima)))
  cat(sprintf("BIC: %.2f\n", BIC(fit_arima)))
  
  forecast_df <- data.frame(
    period = 1:forecast_periods,
    point_forecast = as.numeric(forecast_result$mean),
    lower_80 = as.numeric(forecast_result$lower[, 1]),
    upper_80 = as.numeric(forecast_result$upper[, 1]),
    lower_95 = as.numeric(forecast_result$lower[, 2]),
    upper_95 = as.numeric(forecast_result$upper[, 2])
  )
  
  historical_df <- data.frame(
    period = seq(-length(historical_demand) + 1, 0),
    demand = historical_demand
  )
  
  plot_forecast <- ggplot() +
    geom_line(data = historical_df, aes(x = period, y = demand), 
              color = "#0088FE", size = 1) +
    geom_line(data = forecast_df, aes(x = period, y = point_forecast), 
              color = "#FF8042", size = 1) +
    geom_ribbon(data = forecast_df, 
                aes(x = period, ymin = lower_95, ymax = upper_95),
                alpha = 0.2, fill = "#00C49F") +
    geom_ribbon(data = forecast_df,
                aes(x = period, ymin = lower_80, ymax = upper_80),
                alpha = 0.3, fill = "#00C49F") +
    theme_minimal() +
    labs(title = "Demand Forecasting with Confidence Intervals",
         x = "Time Period", y = "Demand") +
    theme(plot.title = element_text(hjust = 0.5, face = "bold"))
  
  ggsave("pricing_output/demand_forecast.png", 
         plot_forecast, width = 10, height = 6)
  
  return(list(
    model = fit_arima,
    forecast = forecast_result,
    forecast_df = forecast_df
  ))
}

revenue_attribution_analysis <- function(pricing_changes, revenue_data) {
  cat("\n=== Revenue Attribution Analysis ===\n")
  
  model <- lm(revenue ~ price_change + inventory_factor + competitor_position, 
              data = data.frame(pricing_changes, revenue = revenue_data))
  
  summary_model <- summary(model)
  
  cat("\nRegression Results:\n")
  print(summary_model$coefficients)
  cat(sprintf("\nR-squared: %.4f\n", summary_model$r.squared))
  cat(sprintf("Adjusted R-squared: %.4f\n", summary_model$adj.r.squared))
  
  coefficients <- coef(model)
  
  total_effect <- sum(abs(coefficients[-1]))
  attribution <- abs(coefficients[-1]) / total_effect * 100
  
  cat("\nRevenue Attribution:\n")
  cat(sprintf("  Price Changes: %.2f%%\n", attribution["price_change"]))
  cat(sprintf("  Inventory Optimization: %.2f%%\n", attribution["inventory_factor"]))
  cat(sprintf("  Competitive Positioning: %.2f%%\n", attribution["competitor_position"]))
  
  attribution_df <- data.frame(
    factor = c("Price Changes", "Inventory Optimization", "Competitive Positioning"),
    attribution = as.numeric(attribution)
  )
  
  plot_attribution <- ggplot(attribution_df, aes(x = reorder(factor, attribution), 
                                                 y = attribution, fill = factor)) +
    geom_bar(stat = "identity") +
    coord_flip() +
    scale_fill_manual(values = c("#0088FE", "#00C49F", "#FFBB28")) +
    theme_minimal() +
    labs(title = "Revenue Lift Attribution",
         x = "", y = "Attribution (%)") +
    theme(plot.title = element_text(hjust = 0.5, face = "bold"),
          legend.position = "none")
  
  ggsave("pricing_output/revenue_attribution.png", 
         plot_attribution, width = 8, height = 6)
  
  return(list(
    model = model,
    attribution = attribution,
    coefficients = coefficients
  ))
}

export_results <- function(results_list, filename = "pricing_analytics_results.json") {
  json_results <- toJSON(results_list, pretty = TRUE, auto_unbox = TRUE)
  write(json_results, file = sprintf("pricing_output/%s", filename))
  cat(sprintf("\nResults exported to: pricing_output/%s\n", filename))
}

main_analysis <- function() {
  cat("========================================\n")
  cat("Dynamic Pricing Engine - R Analytics\n")
  cat("========================================\n\n")
  
  set_working_directory()
  
  set.seed(42)
  purchase_data <- rpois(100, lambda = 15)
  gp_results <- gamma_poisson_analysis(purchase_data, "PROD001")
  
  prices <- seq(20, 50, length.out = 50)
  quantities <- 2000 - 30 * prices + rnorm(50, 0, 50)
  elasticity_results <- calculate_price_elasticity(prices, quantities, "PROD001")
  
  variants_data <- list(
    control = list(conversions = 180, trials = 5000),
    variant_a = list(conversions = 210, trials = 5000),
    variant_b = list(conversions = 195, trials = 5000)
  )
  ab_results <- bayesian_ab_test(variants_data)
  
  historical_demand <- rpois(60, lambda = 1200) + rnorm(60, 0, 100)
  forecast_results <- demand_forecasting(historical_demand, 14)
  
  pricing_changes <- list(
    price_change = rnorm(100, 0, 0.1),
    inventory_factor = rnorm(100, 1, 0.2),
    competitor_position = rnorm(100, 0, 0.15)
  )
  revenue_data <- 50000 + 10000 * pricing_changes$price_change - 
                  8000 * pricing_changes$inventory_factor +
                  5000 * pricing_changes$competitor_position + rnorm(100, 0, 2000)
  attribution_results <- revenue_attribution_analysis(pricing_changes, revenue_data)
  
  all_results <- list(
    gamma_poisson = list(
      alpha = gp_results$alpha,
      beta = gp_results$beta,
      mean = gp_results$mean,
      variance = gp_results$variance,
      overdispersion = gp_results$overdispersion
    ),
    elasticity = list(
      value = elasticity_results$elasticity,
      r_squared = elasticity_results$r_squared,
      interpretation = elasticity_results$interpretation
    ),
    ab_test = list(
      winner = ab_results$winner,
      probabilities = ab_results$prob_best
    ),
    revenue_attribution = list(
      attribution_percentages = attribution_results$attribution
    )
  )
  
  export_results(all_results)
  
  cat("\n========================================\n")
  cat("Analysis Complete!\n")
  cat("All visualizations saved to: pricing_output/\n")
  cat("========================================\n")
}

main_analysis()