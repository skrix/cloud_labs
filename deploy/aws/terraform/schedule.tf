# Day: API at least api_day_min tasks; night: at least autoscaling_min. The worker keeps worker_min.
resource "aws_appautoscaling_scheduled_action" "api_day" {
  count              = var.schedule_enabled ? 1 : 0
  name               = "${var.project}-api-day"
  service_namespace  = aws_appautoscaling_target.api.service_namespace
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  schedule           = var.schedule_day_cron
  timezone           = var.schedule_timezone

  scalable_target_action {
    min_capacity = var.api_day_min
    max_capacity = var.autoscaling_max
  }
}

resource "aws_appautoscaling_scheduled_action" "api_night" {
  count              = var.schedule_enabled ? 1 : 0
  name               = "${var.project}-api-night"
  service_namespace  = aws_appautoscaling_target.api.service_namespace
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  schedule           = var.schedule_night_cron
  timezone           = var.schedule_timezone

  scalable_target_action {
    min_capacity = var.autoscaling_min
    max_capacity = var.autoscaling_max
  }
}
