import RequestState from "../state/request";

function decode(str: string)
{
  return decodeURIComponent(str.replace(/\+/g, ' '))
}

export function parseParams(query: string): { [key: string]: string }
{
  if (!query) return {}
  if (query.charAt(0) === '?') {
    query = query.slice(1)
  }
  const pairs = query.split('&')
  const result: any = {}
  for (let i = 0; i < pairs.length; i++) {
    const value = pairs[i]
    const index = value.indexOf('=')
    if (index > -1) {
      result[decode(value.slice(0, index))] = decode(value.slice(index + 1))
    } else if (value.length) {
      result[decode(value)] = ''
    }
  }

  return result

}

export function buildParams(params: { [key: string]: string | undefined }): string
{
  let result = ''
  for (let key in params) {
    const value = params[key]
    if (value === undefined) {
      continue
    }
    result += key + '=' + encodeURIComponent(value) + "&"
  }
  if (result === '') {
    return ''
  }

  return '?' + result.substring(0, result.length - 1)
}


export function buildUrlFromRequest(request: RequestState): string {
	return '/' + buildParams(request)
}
