import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import * as Chokidar from 'chokidar';
import { EventEmitter } from 'events';
import { IDatasource, IDatasourceService } from '../models/datasource';
import { StringUtils } from '../utils/utils';

const log = console.log.bind(console),
  log_error = console.error.bind(console);

/**
 * Recursively walk through a folder and collect all files to be rendered (once).
 * 
 * @export
 * @class FolderDatasource
 * @implements {IDatasourceService}
 */
export class FolderDatasource extends EventEmitter implements IDatasourceService {
  public acceptedFileFormats = ['json', 'geojson'];

  constructor(private folder: string) {
    super();
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }
    this.folder = path.resolve(this.folder);
  }

  process(cb: (err: NodeJS.ErrnoException, datasources?: IDatasource[]) => void) {
    // if (!path.isAbsolute(this.folder)) { this.folder = path.join(process.cwd(), this.folder); }

    if (!fs.existsSync(this.folder)) {
      return cb(<NodeJS.ErrnoException>{ message: `Error reading ${this.folder}.` });
    }

    this.walk(this.folder, (err, files) => {
      if (err) { return cb(err); }
      let datasources: IDatasource[] = [];
      files.forEach(file => {
        let ext = path.extname(file).replace('.', '');
        if (this.acceptedFileFormats.indexOf(ext) < 0) return;
        let stats = fs.statSync(file);
        if (stats['size'] > 0) {
          let title = StringUtils.getFilenameWithoutExtension(file);
          datasources.push({
            layerID: StringUtils.hash(title),
            title: title,
            file: file
          });
        }
      });
      this.initWatcher();
      cb(null, datasources);
    });
  }

  /**
   * Watch the input folder for file changes. Raise an event when this occurs.
   * 
   * @private
   * 
   * @memberOf FolderDatasource
   */
  private initWatcher() {
    const watchFolders = `*.{${this.acceptedFileFormats.join(',')}}`;
    log(`Start watching folders ${watchFolders}`);
    let watcher = Chokidar.watch(watchFolders, {
      // Defines files/paths to be ignored. The whole relative or absolute path is tested, not just filename.
      ignored: /[\/\\]\./,
      // If set to false then add/addDir events are also emitted for matching paths while instantiating the watching as chokidar discovers these file paths (before the ready event).
      ignoreInitial: true,
      persistent: true,
      cwd: this.folder
    });

    // Add event listeners.
    watcher
      .on('add', path => {
        log(`File ${path} has been added`);
        this.processFileChanged(path, 'add');
      })
      .on('change', path => {
        log(`File ${path} has been changed`);
        this.processFileChanged(path, 'change');
      })
      .on('unlink', path => {
        log(`File ${path} has been removed`);
        this.processFileChanged(path, 'remove');
      });

      log(`Chokidar is watching folder ${JSON.stringify(watcher.getWatched())}`);
  }

  private processFileChanged(file: string, change: 'add' | 'remove' | 'change') {
    let filePath = path.join(this.folder, file);
    let ext = path.extname(filePath).replace('.', '');
    if (this.acceptedFileFormats.indexOf(ext) < 0) return;
    let title = StringUtils.getFilenameWithoutExtension(filePath);
    this.emit('fileChange', {
      datasource: <IDatasource>{
        layerID: StringUtils.hash(title),
        title: title,
        file: filePath
      },
      change: change
    });
  }

  /**
   * Recursively walk through a folder.
   * 
   * Source: http://stackoverflow.com/a/5827895/319711
   * @private
   * @param {string} dir
   * @param {(err: NodeJS.ErrnoException, files?: string[]) => void} done
   * 
   * @memberOf FolderDatasource
   */
  private walk(dir: string, done: (err: NodeJS.ErrnoException, files?: string[]) => void) {
    let results: string[] = [];
    fs.readdir(dir, (err, list) => {
      if (err) return done(err);
      let pending = list.length;
      if (!pending) return done(null, results);
      list.forEach(file => {
        file = path.resolve(dir, file);
        fs.stat(file, (err, stat) => {
          if (stat && stat.isDirectory()) {
            this.walk(file, (err, res) => {
              results = results.concat(res);
              if (!--pending) done(null, results);
            });
          } else {
            results.push(file);
            if (!--pending) done(null, results);
          }
        });
      });
    });
  };
}
