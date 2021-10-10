// @ts-nocheck
/** @type {import('jscodeshift').Transform} */
function transformer(file, api) {
  const j = api.jscodeshift

  const source = j(file.source)

  const defineNames = [
    "defineUserCommand",
    "defineMessageCommand",
    "defineSlashCommand",
  ]

  const functionDeclaration = j(
    j.functionDeclaration(
      j.identifier("defineCommands"),
      [
        {
          ...j.identifier("gatekeeper"),
          typeAnnotation: j.tsTypeAnnotation(
            j.tsTypeReference(j.identifier("Gatekeeper")),
          ),
        },
      ],
      j.blockStatement([]),
    ),
  )

  source
    .find(j.ExportNamedDeclaration)
    .filter((p) => {
      const calleeName = getCallExpressionFromExportNamedDeclaration(p)
        .get("callee")
        .get("name")

      return defineNames.includes(calleeName.value)
    })
    .forEach((p) => {
      const callExpression = getCallExpressionFromExportNamedDeclaration(p)
      const functionName = callExpression.get("callee").get("name").value
      const options = callExpression.get("arguments").get(0)

      functionDeclaration
        .get("body")
        .get("body")
        .push(
          j.expressionStatement(
            j.callExpression(
              j.memberExpression(
                j.identifier("gatekeeper"),
                j.identifier(functionName.replace("define", "add")),
              ),
              [options.value],
            ),
          ),
        )

      p.prune()
    })

  const body = source.find(j.Program).get("body")
  body.push(j.exportDefaultDeclaration(functionDeclaration.get(0).node))

  const gatekeeperImports = source.find(j.ImportDeclaration).filter((p) =>
    p
      .get("source")
      .get("value")
      .value.match(/^@itsmapleleaf\/gatekeeper/),
  )

  gatekeeperImports.forEach((p) => {
    p.get("specifiers").each((specifier) => {
      const name = specifier.get("imported").get("name").value
      if (defineNames.includes(name)) {
        specifier.prune()
      }
    })
  })

  gatekeeperImports
    .paths()[0]
    ?.get("specifiers")
    .push(j.importSpecifier(j.identifier("Gatekeeper")))

  return source.toSource()
}

function getCallExpressionFromExportNamedDeclaration(p) {
  return p.get("declaration").get("declarations").get(0).get("init")
}

module.exports = transformer
module.exports.parser = "ts"
