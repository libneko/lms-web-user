import router from '@/router'

export const openBook = (book_id: number) => {
  const url = getBookUrl(book_id)
  window.open(url, '_blank')
}

export const getBookUrl = (book_id: number) => {
  return router.resolve({
    name: 'introduction',
    params: { id: book_id },
  }).href
}

export enum Theme {
  SYSTEM = 'system',
  LIGHT = 'light',
  DARK = 'dark',
}

export const setTheme = (theme: Theme) => {
  localStorage.setItem('theme', theme)
  applyTheme(theme)
}

export const applyTheme = (theme: Theme) => {
  if (theme === Theme.SYSTEM) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  } else if (theme === Theme.DARK) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const initTheme = () => {
  const theme = (localStorage.getItem('theme') as Theme) || Theme.SYSTEM
  applyTheme(theme)

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = (localStorage.getItem('theme') as Theme) || Theme.SYSTEM
    if (currentTheme === Theme.SYSTEM) {
      applyTheme(Theme.SYSTEM)
    }
  })

  window.addEventListener('storage', (event) => {
    if (event.key === 'theme') {
      const newTheme = (event.newValue as Theme) || Theme.SYSTEM
      applyTheme(newTheme)
    }
  })
}
