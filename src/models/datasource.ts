/**
 * Definition of a datasource.
 * 
 * @export
 * @class Datasource
 */
export interface IDatasource {
  /**
   * The layer ID is a unique number based on a hash of the title.
   * We use the number to reduce the URL length of the client when adding multiple layers. 
   * 
   * @type {number}
   * @memberOf IDatasource
   */
  layerID: number;
  title: string;
  file: string;
}

export interface IDatasourceService {
  process(cb: (err: NodeJS.ErrnoException, datasources?: IDatasource[]) => void);
}
