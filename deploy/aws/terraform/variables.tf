variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "project" {
  type    = string
  default = "iot-hub"
}

variable "github_repo" {
  type = string
}

variable "budget_email" {
  type = string
}

variable "app_path" {
  type    = string
  default = "../../.."
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "autoscaling_min" {
  type    = number
  default = 1
}

variable "autoscaling_max" {
  type    = number
  default = 4
}

variable "autoscaling_cpu_target" {
  description = "Target average CPU utilization of the API service, %"
  type        = number
  default     = 50
}

variable "autoscaling_scale_out_cooldown" {
  description = "Seconds after a scale-out before another scale-out may build on it"
  type        = number
  default     = 60
}

variable "autoscaling_scale_in_cooldown" {
  description = "Seconds after a scaling activity before the next scale-in"
  type        = number
  default     = 300
}
