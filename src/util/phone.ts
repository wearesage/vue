import { phone } from 'phone' 

export function validatePhoneNumber (number: string, country:any = undefined) {
  const { isValid: valid, phoneNumber: value } = phone(number, country && { country })
  return { valid, value }
}