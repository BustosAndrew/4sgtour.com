export interface WeTravelPackage {
  id: string
  trip_uuid: string
  name: string
  price: number
  quantity: number
  description: string
  days_before_departure: number
  created_at: number
}

export interface WeTravelOption {
  id: string
  trip_uuid: string
  name: string
  description: string
  price: number
  price_type: string
  quantity: number
  days_before_departure: number
  created_at: number
}

export interface WeTravelPackagesResponse {
  data: WeTravelPackage[]
}

export interface WeTravelOptionsResponse {
  data: WeTravelOption[]
}

export interface WeTravelPaymentLinkRequest {
  data: {
    trip: {
      title: string
      trip_id?: string
      start_date: string
      end_date: string
      currency: string
      participant_fees: string
    }
    pricing: {
      price: number
      days_before_departure: number
      payment_plan: {
        allow_auto_payment: boolean
        allow_partial_payment: boolean
        deposit?: number
        installments?: Array<{
          price: number
          days_before_departure: number
        }>
      }
    }
  }
}

export interface WeTravelPaymentLinkResponse {
  data: {
    trip: {
      uuid: string
      title: string
      trip_id: string
      url: string
      defaultImageUrl: string
      start_date: string
      end_date: string
      currency: string
      participant_fees: string
    }
    pricing: {
      price: number
      days_before_departure: number
      payment_plan: {
        allow_auto_payment: boolean
        allow_partial_payment: boolean
        deposit: number
        installments: Array<{
          price: number
          days_before_departure: number
        }>
      }
    }
  }
}
