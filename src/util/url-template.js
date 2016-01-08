/**
 * URL Template v2.0.6 (https://github.com/bramstein/url-template)
 */

export function expand (url, params, variables) {
  const tmpl = parse(url)
  const expanded = tmpl.expand(params)

  if (variables) {
    variables.push.apply(variables, tmpl.vars)
  }

  return expanded
}

export function parse (template) {
  const operators = ['+', '#', '.', '/', ';', '?', '&']
  const variables = []

  return {
    vars: variables,
    expand: (context) => {
      return template.replace(/\{([^\{\}]+)\}|([^\{\}]+)/g, (_, expression, literal) => {
        if (expression) {
          let operator = null
          const values = []

          if (operators.indexOf(expression.charAt(0)) !== -1) {
            operator = expression.charAt(0)
            expression = expression.substr(1)
          }

          expression.split(/,/g).forEach(variable => {
            const tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable)
            values.push.apply(values, exports.getValues(context, operator, tmp[1], tmp[2] || tmp[3]))
            variables.push(tmp[1])
          })

          if (operator && operator !== '+') {
            let separator = ','
            if (operator === '?') {
                separator = '&';
            } else if (operator !== '#') {
                separator = operator
            }
            return (values.length !== 0 ? operator : '') + values.join(separator)
          } else {
            return values.join(',')
          }
        } else {
          return encodeReserved(literal)
        }
      })
    }
  }
}

export function getValues (context, operator, key, modifier) {
  let value = context[key]
  const result = []

  if (isDefined(value) && value !== '') {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      value = value.toString()

      if (modifier && modifier !== '*') {
        value = value.substring(0, parseInt(modifier, 10))
      }

      result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : null))
    } else {
      if (modifier === '*') {
        if (Array.isArray(value)) {
          value.filter(isDefined).forEach(value => {
            result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : null))
          })
        } else {
          Object.keys(value).forEach(k => {
            if (isDefined(value[k])) {
              result.push(encodeValue(operator, value[k], k))
            }
          })
        }
      } else {
        const tmp = []

        if (Array.isArray(value)) {
          value.filter(isDefined).forEach(value => {
              tmp.push(encodeValue(operator, value));
          })
        } else {
          Object.keys(value).forEach(k => {
            if (isDefined(value[k])) {
              tmp.push(encodeURIComponent(k))
              tmp.push(encodeValue(operator, value[k].toString()))
            }
          })
        }

        if (isKeyOperator(operator)) {
          result.push(encodeURIComponent(key) + '=' + tmp.join(','))
        } else if (tmp.length !== 0) {
          result.push(tmp.join(','))
        }
      }
    }
  } else {
    if (operator === ';') {
      result.push(encodeURIComponent(key))
    } else if (value === '' && (operator === '&' || operator === '?')) {
      result.push(encodeURIComponent(key) + '=')
    } else if (value === '') {
      result.push('')
    }
  }

  return result
}

export function isDefined (value) {
  return value !== undefined && value !== null
}

export function isKeyOperator (operator) {
  return operator === ';'
    || operator === '&'
    || operator === '?'
}

export function encodeValue (operator, value, key) {
  value = (operator === '+' || operator === '#')
    ? encodeReserved(value)
    : encodeURIComponent(value)
  if (key) {
    return encodeURIComponent(key) + '=' + value;
  } else {
    return value
  }
}

export function encodeReserved (str) {
  return str.split(/(%[0-9A-Fa-f]{2})/g).map(part => {
    if (!/%[0-9A-Fa-f]/.test(part)) {
      part = encodeURI(part)
    }
    return part
  }).join('')
}
