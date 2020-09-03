Array.from(document.getElementsByClassName("example")).forEach(ex => {
  const pre = document.createElement("pre")
  pre.className = "html"
  pre.appendChild(document.createTextNode(ex.innerHTML))
  ex.insertBefore(pre, ex.firstChild)

  const title = ex.getAttribute("title")
  if (title) {
    ex.insertBefore(document.createTextNode(title+":"), ex.firstChild)
  }
})

function syntaxHighlight(name, mode) {
  Array.from(document.getElementsByClassName(name)).forEach(html => {
    CodeMirror(function(e) { html.parentNode.replaceChild(e, html) },{
      value: html.innerText,
      mode,
      htmlMode: true,
      readOnly: true
    })
  })
}

syntaxHighlight('html', 'xml')
syntaxHighlight('pica', 'pica')
