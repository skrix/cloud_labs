resource "aws_appautoscaling_target" "api" {
  service_namespace  = "ecs"
  scalable_dimension = "ecs:service:DesiredCount"
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  min_capacity       = var.autoscaling_min
  max_capacity       = var.autoscaling_max
}

# Target tracking creates and owns two CloudWatch alarms (TargetTracking-service/...-AlarmHigh/-AlarmLow):
#   high: average CPU > target for 3 consecutive 1-minute datapoints   -> scale out
#   low:  average CPU < 90% of target for 15 consecutive datapoints    -> scale in
resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${var.project}-api-cpu"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.api.service_namespace
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  resource_id        = aws_appautoscaling_target.api.resource_id

  target_tracking_scaling_policy_configuration {
    target_value       = var.autoscaling_cpu_target
    scale_out_cooldown = var.autoscaling_scale_out_cooldown
    scale_in_cooldown  = var.autoscaling_scale_in_cooldown
    disable_scale_in   = false

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
