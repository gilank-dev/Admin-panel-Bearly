import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Halaman Tidak Ditemukan | Bearly Admin',
  description: 'Halaman yang Anda cari tidak ditemukan.',
}

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 px-4 text-center">
      <div className="max-w-md p-8 rounded-xl border border-gray-800 bg-gray-900 shadow-2xl">
        <h1 className="text-6xl font-extrabold text-blue-500 mb-2">404</h1>
        <h2 className="text-xl font-bold text-white mb-4">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-400 text-sm mb-6">
          Halaman yang Anda cari tidak ada atau Anda tidak memiliki akses.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}