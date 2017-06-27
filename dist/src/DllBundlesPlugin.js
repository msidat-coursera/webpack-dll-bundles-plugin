"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DllPlugin = require('webpack/lib/DllPlugin');
var DllReferencePlugin = require('webpack/lib/DllReferencePlugin');
var Path = require("path");
var fs = require("fs");
var utils_1 = require("./utils");
var DllBundlesControl_1 = require("./DllBundlesControl");
var DllBundlesPlugin = (function () {
    function DllBundlesPlugin(options) {
        this.setOptions(options);
    }
    DllBundlesPlugin.prototype.apply = function (compiler) {
        var _this = this;
        this.compiler = compiler;
        compiler.plugin('run', function (compiler, next) { return _this.run(next); });
        compiler.plugin('watch-run', function (compiler, next) { return _this.run(next); });
    };
    DllBundlesPlugin.prototype.applyPlugins = function () {
        var _this = this;
        var context = this.options.context;
        var newPlugins = this.bundles.map(function (bundle) {
            var manifestPath = Path.join(_this.options.dllDir, bundle.name + "-manifest.json");
            if (fs.existsSync(manifestPath)) {
                return new DllReferencePlugin({ manifest: require(manifestPath), context: context });
            }
        });
        newPlugins.forEach(function (plugin) { return plugin.apply(_this.compiler); });
        (_a = this.compiler.options.plugins).push.apply(_a, newPlugins);
        var _a;
    };
    DllBundlesPlugin.prototype.run = function (next) {
        var _this = this;
        console.info('DLL: Checking if DLLs are valid.');
        this.bundleControl.checkBundles()
            .then(function (bundles) {
            if (bundles.length === 0) {
                _this.applyPlugins();
                return console.info('DLL: All DLLs are valid.');
            }
            else {
                console.info('DLL: Rebuilding...');
                var newEntry = _this.bundles.reduce(function (prev, curr) {
                    prev[curr.name] = curr.packages.map(function (p) { return typeof p === 'string' ? p : p.path; });
                    return prev;
                }, {});
                var webpackConfig = Object.assign({}, _this.options.webpackConfig, {
                    entry: newEntry,
                    output: {
                        path: _this.options.dllDir,
                        filename: '[name].dll.js',
                        library: '[name]_lib'
                    },
                });
                if (!webpackConfig.plugins) {
                    webpackConfig.plugins = [];
                }
                webpackConfig.plugins.push(new DllPlugin({
                    path: Path.join(_this.options.dllDir, '[name]-manifest.json'),
                    name: '[name]_lib',
                }));
                return utils_1.runWebpack(webpackConfig).done
                    .then(function (stats) { return _this.bundleControl.saveBundleState(); })
                    .then(function () {
                    _this.applyPlugins();
                    console.info('DLL: Bundling done, all DLLs are valid.');
                });
            }
        })
            .then(function () { return next(); })
            .catch(function (err) { return next(err); });
    };
    DllBundlesPlugin.prototype.setOptions = function (options) {
        this.options = Object.assign({}, options);
        if (!this.options.context) {
            this.options.context = process.cwd();
        }
        if (!Path.isAbsolute(this.options.context)) {
            throw new Error('Context must be an absolute path');
        }
        if (!Path.isAbsolute(this.options.dllDir)) {
            this.options.dllDir = Path.resolve(this.options.context, this.options.dllDir);
        }
        var bundles = this.options.bundles;
        this.bundles = Object.keys(bundles).map(function (k) { return ({ name: k, packages: bundles[k] }); });
        this.bundleControl = new DllBundlesControl_1.DllBundlesControl(this.bundles, this.options);
    };
    DllBundlesPlugin.resolveFile = function (bundleName) {
        return bundleName + ".dll.js";
    };
    return DllBundlesPlugin;
}());
exports.DllBundlesPlugin = DllBundlesPlugin;
//# sourceMappingURL=DllBundlesPlugin.js.map