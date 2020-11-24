/* jshint esversion: 6 */
/* eslint-disable no-undef*/
/* eslint-disable no-restricted-globals*/
import RichLogger from '../src/richLogger';

let _self = null,
  _version = null,
  _events = null,
  _options = null,
  _fileName = null,
  _limit = null,
  _logger = null;
export default class Paginator {
  constructor(options,logger) {
    _version = '1.0.0';
    _fileName = 'paginator.js';

    if (typeof options !== 'undefined') {
      _options = options;
    }
    if (typeof options.limit !== 'undefined') {
      _limit = 10;
    }else{
      _limit = options.limit;
    }
    if (typeof options.logger === 'undefined') {
      _logger = new RichLogger(_options.env, {});
    }else{
      _logger = logger;
    }
    _self = this;
    _logger.info(_fileName, `Module loaded v.${_version}`);
  }

  numberOfPages(total,limit){
    _logger.info(_fileName, `numberOfPages(${total},${limit})`);
    return Math.ceil(total/limit);
  }

  getOffset(pag){
    var offset = 0;
    if(pag>1){
      offset=((pag-1)*_limit);
    }else{
      offset=0;
    }
    //protección para que no mande offset negativos
    if(offset<0){
      offset=0;
    }
    return offset;
  }

  getPageNumber(){
	//	return $this->pagina."/$this->pages";
	}

  /*getPrevious(){
		newoffset=_limit*($this->pagina-2);
		anterior=$this->pagina-1;
		return {'offset': $newoffset,'pagina': anterior};
	}
	getNext(){
		$newoffset=$this->limit*($this->pagina);
		$siguiente=$this->pagina+1;
		return "offset=".$newoffset."&pagina=".$siguiente;
	}
	getLast(){
		$newoffset=$this->limit*($this->pages-1);
		return "offset=".$newoffset."&pagina=".$this->pages;
	}*/

}




  /*



	public static function fDameOffset($pag,$limit){
		$Paginador = new self();
		if($pag>1){
			$offset=(($pag-1)*$limit);
		}else{
			$offset=0;
		}
		//protección para que no mande offset negativos
		if($offset<0){
			$offset=0;
		}
		return $offset;
	}




	public function fNumPag(){
		return $this->pagina."/$this->pages";
	}
	public function */
