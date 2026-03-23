'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BookUploadForm from './BookUploadForm'
import BooksList from './BooksList'

interface Book {
  id: string
  title: string
  author: string
  month: string
  file_url: string
  plan?: string
}

export default function BooksManager({ initialBooks }: { initialBooks: Book[] }) {
  const [books, setBooks] = useState(initialBooks)
  const router = useRouter()

  function handleSaved() {
    router.refresh()
  }

  return (
    <>
      {/* Upload form */}
      <div style={{ marginBottom: 56 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 24 }}>
          <span style={{ color: 'var(--red-dim)' }}>// </span>Adicionar livro
        </p>
        <BookUploadForm onSaved={handleSaved} />
      </div>

      {/* Books list */}
      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 24 }}>
          <span style={{ color: 'var(--red-dim)' }}>// </span>Biblioteca atual ({books.length})
        </p>
        <BooksList books={initialBooks} />
      </div>
    </>
  )
}
