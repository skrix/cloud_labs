resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.budget_email
}

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${var.project}-api-5xx"
  alarm_description   = "API returned 5xx responses"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_Target_5XX_Count"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  threshold           = 1
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.api.arn_suffix
    TargetGroup  = aws_lb_target_group.api.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "api_unhealthy" {
  alarm_name          = "${var.project}-api-unhealthy"
  alarm_description   = "No healthy API targets behind the load balancer"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HealthyHostCount"
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 3
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.api.arn_suffix
    TargetGroup  = aws_lb_target_group.api.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "api_latency_p95" {
  alarm_name          = "${var.project}-api-latency-p95"
  alarm_description   = "API p95 latency above ${var.alert_latency_p95_ms} ms for ${var.alert_latency_minutes} minutes (overload)"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "TargetResponseTime"
  extended_statistic  = "p95"
  period              = 60
  evaluation_periods  = var.alert_latency_minutes
  datapoints_to_alarm = var.alert_latency_minutes
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.alert_latency_p95_ms / 1000 # TargetResponseTime is in seconds
  treat_missing_data  = "notBreaching"                  # no traffic is not an overload
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.api.arn_suffix
  }
}

locals {
  alb_dimensions = ["LoadBalancer", aws_lb.api.arn_suffix]
  ecs_dimensions = ["ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.api.name]
}

resource "aws_cloudwatch_dashboard" "api" {
  dashboard_name = var.project
  dashboard_body = jsonencode({
    periodOverride = "inherit"
    widgets = [
      {
        type = "metric", x = 0, y = 0, width = 12, height = 6
        properties = {
          title  = "ECS tasks (desired / running)"
          region = var.region
          stat   = "Maximum"
          period = 60
          yAxis  = { left = { min = 0, max = var.autoscaling_max + 1 } }
          metrics = [
            concat(["ECS/ContainerInsights", "DesiredTaskCount"], local.ecs_dimensions, [{ label = "Desired" }]),
            concat(["ECS/ContainerInsights", "RunningTaskCount"], local.ecs_dimensions, [{ label = "Running" }]),
          ]
        }
      },
      {
        type = "metric", x = 12, y = 0, width = 12, height = 6
        properties = {
          title  = "API CPU / memory (%)"
          region = var.region
          stat   = "Average"
          period = 60
          yAxis  = { left = { min = 0, max = 100 } }
          annotations = {
            horizontal = [{ label = "Scale-out target", value = var.autoscaling_cpu_target }]
          }
          metrics = [
            concat(["AWS/ECS", "CPUUtilization"], local.ecs_dimensions, [{ label = "CPU" }]),
            concat(["AWS/ECS", "MemoryUtilization"], local.ecs_dimensions, [{ label = "Memory" }]),
          ]
        }
      },
      {
        type = "metric", x = 0, y = 6, width = 8, height = 6
        properties = {
          title   = "Requests per minute"
          region  = var.region
          stat    = "Sum"
          period  = 60
          metrics = [concat(["AWS/ApplicationELB", "RequestCount"], local.alb_dimensions, [{ label = "Requests" }])]
        }
      },
      {
        type = "metric", x = 8, y = 6, width = 8, height = 6
        properties = {
          title  = "Latency p95 (seconds)"
          region = var.region
          period = 60
          annotations = {
            horizontal = [{ label = "Alert threshold", value = var.alert_latency_p95_ms / 1000 }]
          }
          metrics = [
            concat(["AWS/ApplicationELB", "TargetResponseTime"], local.alb_dimensions, [{ stat = "p95", label = "p95" }]),
            concat(["AWS/ApplicationELB", "TargetResponseTime"], local.alb_dimensions, [{ stat = "p50", label = "p50" }]),
          ]
        }
      },
      {
        type = "metric", x = 16, y = 6, width = 8, height = 6
        properties = {
          title  = "5xx responses per minute"
          region = var.region
          stat   = "Sum"
          period = 60
          metrics = [
            concat(["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count"], local.alb_dimensions, [{ label = "API" }]),
            concat(["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count"], local.alb_dimensions, [{ label = "Load balancer" }]),
          ]
        }
      },
      {
        type = "metric", x = 0, y = 12, width = 12, height = 6
        properties = {
          title  = "Database CPU (%) / connections"
          region = var.region
          stat   = "Average"
          period = 60
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.identifier, { label = "CPU" }],
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.main.identifier, { label = "Connections", yAxis = "right" }],
          ]
        }
      },
      {
        type = "metric", x = 12, y = 12, width = 12, height = 6
        properties = {
          title  = "Database reads (MB/s) / Redis CPU (%)"
          region = var.region
          stat   = "Average"
          period = 60
          yAxis = {
            left  = { label = "MB/s", showUnits = false, min = 0 }
            right = { label = "%", showUnits = false, min = 0 }
          }
          metrics = [
            [{ expression = "tx / 1000000", id = "reads", label = "Database reads" }],
            ["AWS/RDS", "NetworkTransmitThroughput", "DBInstanceIdentifier", aws_db_instance.main.identifier, { id = "tx", visible = false }],
            ["AWS/ECS", "CPUUtilization", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.redis.name, { label = "Redis CPU", yAxis = "right" }],
          ]
        }
      },
      {
        type = "metric", x = 0, y = 18, width = 8, height = 6
        properties = {
          title  = "Ingest queue: messages waiting / age of oldest (s)"
          region = var.region
          stat   = "Maximum"
          period = 60
          yAxis = {
            left  = { label = "Messages", showUnits = false, min = 0 }
            right = { label = "Seconds", showUnits = false, min = 0 }
          }
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.ingest.name, { label = "Waiting" }],
            ["AWS/SQS", "ApproximateNumberOfMessagesNotVisible", "QueueName", aws_sqs_queue.ingest.name, { label = "Being processed" }],
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", aws_sqs_queue.ingest.name, { label = "Age of oldest", yAxis = "right" }],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.ingest_dlq.name, { label = "Dead letter" }],
          ]
        }
      },
      {
        type = "metric", x = 8, y = 18, width = 8, height = 6
        properties = {
          title  = "Ingest messages per minute (queued / stored)"
          region = var.region
          stat   = "Sum"
          period = 60
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", aws_sqs_queue.ingest.name, { label = "Queued by API" }],
            ["AWS/SQS", "NumberOfMessagesDeleted", "QueueName", aws_sqs_queue.ingest.name, { label = "Stored by worker" }],
          ]
        }
      },
      {
        type = "metric", x = 16, y = 18, width = 8, height = 6
        properties = {
          title  = "Worker tasks (desired / running)"
          region = var.region
          stat   = "Maximum"
          period = 60
          yAxis  = { left = { min = 0, max = var.worker_max + 1 } }
          metrics = [
            ["ECS/ContainerInsights", "DesiredTaskCount", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.worker.name, { label = "Desired" }],
            ["ECS/ContainerInsights", "RunningTaskCount", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.worker.name, { label = "Running" }],
          ]
        }
      },
      {
        type = "log", x = 0, y = 24, width = 24, height = 6
        properties = {
          title  = "Errors in API / worker logs"
          region = var.region
          query  = "SOURCE '${aws_cloudwatch_log_group.api.name}' | SOURCE '${aws_cloudwatch_log_group.worker.name}' | fields @timestamp, @log, @message | filter level = 'error' or status >= 500 | sort @timestamp desc | limit 50"
          view   = "table"
        }
      },
    ]
  })
}
