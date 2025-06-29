export function loadFonts(fonts: any) {
  fonts.map((font: any) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = font.link
    document.head.appendChild(link)
  })
}