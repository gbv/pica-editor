export async function picaRecordViaSRU({ baseUrl, version }, ppn) {
  if (!baseUrl || !ppn) {
    return Promise.reject({ message: "missing baseUrl or ppn"} )
  }

  const query = {
    operation: "searchRetrieve",
    query: `pica.ppn=${ppn}`,
    recordSchema: "picaxml",
    version: version || "1.2",
    maximumRecords: 1,
  }
  const url = `${baseUrl}?${new URLSearchParams(query).toString()}`
  const response = await fetch(url)

  console.log(url)
  if (!response.ok) {
    console.error(response)
    throw new Error(`SRU request failed with ${response.status}: ${await response.text()}`)
  }

  const parser = new DOMParser()
  const xml = parser.ParseFromString(await response.text(), "text/xml")
  console.log(xml)

  return Promise.resolve([])
}
