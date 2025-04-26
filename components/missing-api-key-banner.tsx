import * as React from 'react'

export function MissingApiKeyBanner({
  missingKeys
}: {
  missingKeys: string[]
}) {
  if (!missingKeys.includes('OPENAI_API_KEY')) {
    return null
  }

  return (
    <div className="border p-4">
      <div className="text-red-700 font-medium">
        Necesitas proveer una key de la api de OpenAi
      </div>
      <a
        href="https://platform.openai.com/api-keys"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm text-red-800 hover:text-red-900"
      >
        <span
          className="ml-1 text-primary font-semibold"
          style={{ textDecoration: 'underline' }}
        >
          {' '}
          Consigue una
        </span>
      </a>
    </div>
  )
}
