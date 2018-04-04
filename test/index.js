require('@webcomponents/custom-elements');
require('@webcomponents/shadydom');
require('@webcomponents/shadycss/scoping-shim.min.js');
// require all modules ending in 'spec' from the
// current directory and all subdirectories
const tests = require.context('.', true, /spec$/);
tests.keys().forEach(tests);