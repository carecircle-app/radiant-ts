'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config' // 4x ../ back to repo root

export default function StudioPage() {
  return <NextStudio config={config} />
}
