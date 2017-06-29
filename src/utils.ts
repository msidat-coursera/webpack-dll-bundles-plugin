import * as webpack from 'webpack';

export type Compiler = webpack.compiler.Compiler;
export type Stats = webpack.compiler.Stats;


export function resolveConfig(config: any): any {
  if(typeof config === 'string') {
    return resolveConfig(require(config));
  } else if (typeof config === 'function') {
    return config();
  } else if (config.__esModule === true && !!config.default) {
    return resolveConfig(config.default);
  } else {
    return config;
  }
}

export function runWebpack(config: any): { done: Promise<Stats> } {
  return {
    done: new Promise( (RSV, RJT) => {
      return webpack(resolveConfig(config), (err: any, stats: any) => {
        if (err) {
          console.error(err.stack || err);

          if (err.details) {
            console.error(err.details)
          }
        }

        const info = stats.toJson();

        if (stats.hasErrors()) {
          console.error(info.errors);
        }

        return err ? RJT(err) : RSV(stats);
      })
    })
  }
}
