Array.from(document.getElementsByClassName("example")).forEach(ex => {
  const pre = document.createElement("pre")
  pre.className = "html"
  var text = ex.innerHTML
  if (text.split("\n").length > 10) text = text.replace(/<pre>.+<.pre>/sm,"...")

  pre.appendChild(document.createTextNode(text))
  ex.insertBefore(pre, ex.firstChild)

  const title = ex.getAttribute("title")
  ex.removeAttribute("title")
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
