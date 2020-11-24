echo "Build Forms sewernet"
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

echo $PACKAGE_VERSION
#FORMS
browserify forms.js > FormsCompiled.$PACKAGE_VERSION.min.js
#cp compiled.js ../dist/forms.$PACKAGE_VERSION.min.js

#CONTROLLER AND DIRECTIVES

cat ../interface.js ../sewernetController.js ../directives/toolsDirectives.js FormsCompiled.$PACKAGE_VERSION.min.js > ../dist/sewernet.$PACKAGE_VERSION.js

rm FormsCompiled.$PACKAGE_VERSION.min.js
#ngmin sewernet.$PACKAGE_VERSION.js sewernet.$PACKAGE_VERSION.min.js
#uglifyjs sewernet.$PACKAGE_VERSION.js --output ../dist/sewernet.$PACKAGE_VERSION.min.js
#rm sewernet.$PACKAGE_VERSION.min.js
#rm sewernet.$PACKAGE_VERSION.js
