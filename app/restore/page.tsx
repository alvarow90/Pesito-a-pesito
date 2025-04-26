'use client'

import { useUserStore } from '@/lib/store/user-store'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function RemoveStore() {
  const { resetStore } = useUserStore()

  useEffect(() => {
    resetStore()
  }, [resetStore])

  return redirect('/new')
}
