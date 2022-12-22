import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Guardia } from './guardia';
import { Absencia, AbsenciaS } from './absencia';
import { DadesMestres, Franja_horaria, Espai, Grup, Materia, Horari } from './dadesmestres';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';
import { format, parseISO } from 'date-fns';
import { Guard, GuardJSON, Absence, AbsenceJSON } from './model/interfaces';
import { HttpOptions } from '@capacitor/core';

// export const USER = new HttpContextToken<string>(() => '');
export const BASE_URL = 'http://localhost:8000/absencies/';

class Dates {
  date2str(valor: Date = new Date()): string {
    console.log('vaig a convertir ', valor);
    //return format(valor, 'dd-MM-yyyy');
    if (valor == null){
      valor = new Date();
    }
    return format(valor, 'yyyy-MM-dd');
    console.log('vaig a convertir ', valor);
    return valor.toString();
  }
  str2date(valor: string): Date {
    return parseISO(valor);
  }
  time2str(valor: Date = new Date()): string {
    return '';
  }
  str2time(valor: string): Date{
    var d = new Date();
    var parts = valor.split(':');
    d.setHours(parseInt(valor[0]));
    d.setMinutes(parseInt(valor[1]));
    return d;
  }
  str2str(valor: string): string{
    var a = new Date();
    a = parseISO(valor);
    return this.date2str(a);
  }
}


export class TodayGuards {
  data: string; 
  dia_setmana: string;
  ndia_setmana: number;
  guardies: Guardia[];
  parts: string[];

  cds = ['Diumenge', 'Dilluns', 'Dimarts' ,'Dimecres' ,'Dijous' ,'Divendres', 'Dissabte', 'Diumenge']

  constructor(d: string, gs: Guardia[]){
    this.data=d; // en format yyyy-MM-dd
    this.guardies = gs;
    this.parts = d.split('-');
    // El mes està indexat a partir de 0, així que febrer ha de ser el mes 1, mentre que el rebem en format cadena, on dóna 2.
    this.ndia_setmana=new Date(parseInt(this.parts[0]), parseInt(this.parts[1])-1, parseInt(this.parts[2])).getDay();
    this.dia_setmana=this.cds[this.ndia_setmana];
    console.log('el dia ',d,' té index ', this.ndia_setmana,' i és ', this.dia_setmana);
    
  }
}

class Absences {

  list: Absencia[] = [];
  guardList: Guard[] = [];
  private absencesUrl = BASE_URL+'api/absencies/';
  dates: Dates = new Dates();

  constructor(
    private http: HttpClient,
    private httpOptions: {headers: HttpHeaders, params: HttpParams}
  ) {}

  get(){
    this.http.get<AbsenceJSON[]>(this.absencesUrl, this.httpOptions)
    .pipe(
      catchError((err) => {
        console.log(err);
        return throwError(err);
      })
    )
    .subscribe(data => {
      console.log('carrega absencies: ', data);
      // console.log(data)
      this.list = [];
      for (var i=0;i<data.length; i++){
        this.list.push ({
          id: data[i].id,
          data: this.dates.str2date(data[i].data),
          data_fi: this.dates.str2date(data[i].data_fi),
          hora_ini: this.dates.str2time(data[i].hora_ini),
          hora_fi: this.dates.str2time(data[i].hora_fi),
          dia_complet: data[i].dia_complet,
          extraescolar: data[i].extraescolar,
          justificada: data[i].justificada,
          guardies: data[i].guardies
        })    
      }
      // La diferència entre **absències** i **guàrdies** és que 
      // una **absència** és multi-dia, i volem editar-la en bloc.
      // D'un altra banda, **guardies** conté les guàrdies d'una data
      // donada, que està associada a una absència en concret.
      var data_g ;
      var d_guardies = {};
      this.guardList = [];
      console.log("carregant absencies. Hi han ", this.list.length);
      for (var i=0; i < this.list.length; i++){
        if (this.list[i].guardies.length > 0 )
          data_g =  this.list[i].guardies[0].data.toString();  // en format DD-MM-YYYY
        console.log ("carregant guardiesl del ", data_g, '. Hi han ', this.list[i].guardies.length);
        for (var j=0; j < this.list[i].guardies.length; j++){
          data_g =  this.list[i].guardies[j].data.toString();
          if (!(data_g in d_guardies))
            d_guardies[data_g] = []
          d_guardies[data_g].push(this.list[i].guardies[j])
        }
      }  
      for (var d in d_guardies){
        // carreguem la guardia de cada absència.
        // this.guardList.push({
        //   data:
        //   dia:
        //   hora:
        //   espai:
        //   grup:
        //   materia:
        //   es_guardia:
        //   professor:
        //   substitut:
        //   feina:
        // })
        console.log("el dia ", d, " té " ,d_guardies[d].length, " guàrdies")
      } 
    }
    );
    return this.list;
  }
  

  push(){}

  insert(){}

  update(objecte: AbsenceJSON) {
    // rep una AbsenceJSON, amb les dates en format cadena.
    // Envia la info al servidor, i si és OK, actualitza a la llista local.
    console.log('actualitzar absència de: ', objecte["data"] , " amb id ",objecte["id"]);
    console.log(JSON.stringify(objecte));
    this.http.post<AbsenceJSON>(this.absencesUrl, JSON.stringify(objecte), this.httpOptions)
      .pipe( catchError( (err) => {
          return throwError(err);
      }) )
      .subscribe( data  => {
        console.log('rebut de lactualització de absencia: ',data);
      })
      ; 
  }
}

class Guards {
  list: Guards[] = [];
  guardList: TodayGuards[] = [];
  private guardsUrl = BASE_URL+'api/guardies/';
  dates: Dates = new Dates();

  constructor(
    private http: HttpClient,
    private httpOptions: {headers: HttpHeaders, params: HttpParams}
  ) {}

  getFromAbsence() {}

  // get guardies del dia
  getFromDate() {
    this.http.get<GuardJSON[]>(this.guardsUrl, this.httpOptions)
    .pipe(
      catchError((err) => {
        console.log(err);
        return throwError(err);
      })
    )
    .subscribe(data => {
      console.log('absencies davui rebudes: ', data);
      for (var i in data){
        this.guardList.push(
          // new TodayGuards(
            
          // )
        )
      }
    })
  }
}

class User {
  id: number;
  name: string;
  centre_id: number;
  centre_name: string;
  auth_token: string;
  
  constructor(
    private http: HttpClient ,
    private httpOptions: {headers: HttpHeaders, params: HttpParams}
  ) {}

  select(name: string){
    if (name != this.name){
      this.name = name;
      if (this.name == 'david') this.id = 1;
      else this.id = 2;
    }
    // this.httpOptions["params"] = this.httpOptions["params"].set('user', this.name);
    this.httpOptions["headers"] = this.httpOptions["headers"].set('Authorization', this.id.toString())
    return true;
  }

  logged_in () {return true;}
}

@Injectable({
  providedIn: 'root'
})
export class AbsenciesService {

  private log (message: string) {
    
  }
  private username = '';

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json', 'credentials': 'include', Authorization: '1' }),
    params: new HttpParams()
  };


  absences = new Absences(this.http, this.httpOptions);
  guards = new Guards(this.http, this.httpOptions);
  user = new User(this.http, this.httpOptions);
  
  // times = new Times();
  // subjects = new Subjects();
  // groups = new Groups();
  // rooms = new Rooms();
  // timetables = new Timetables();


  dadesMestres: DadesMestres;
  private dadesMestresUrl = BASE_URL+'api/login/';
  private dadesMestres_obs: Observable<DadesMestres>;
  // centres: Centre[];
  // usuaris: Usuari[];
  franges_horaries: Map< string, Franja_horaria> = new Map<string, Franja_horaria>;
  espais: Map< string, Espai>  = new Map< string, Espai> ;
  grups: Map< string, Grup>  = new Map< string, Grup>;
  materies: Map< string, Materia> = new Map< string, Materia> ;
  horari: Map< string, Horari>  = new Map< string, Horari> ;
  t3_horari: Map< string, string>  = new Map< string, string> ;
  t3_callback: any;
  
  absencies: Absencia[];
  private absenciesUrl = BASE_URL+'api/absencies/';
  private absencies_obs: Observable<Absencia[]> ;

  
  guardies: Guardia[];
  private guardiesUrl = BASE_URL+'api/guardies/';
  private guardies_obs: Observable<Guardia[]>;
  
  llista_dies: string[] = [];
  llista_hores: string[] = [];
  llista_horesdies: Map<string, Map<string,number>> ;
  
  private dates: any[];
  
  
  
  constructor(
    private http: HttpClient) 
  { 
    this.llista_horesdies = new Map<string, Map<string,number>>();
  }

  select_user(data) {
    // si el login és correcte, recarreguem info.
    if (this.user.select(data)){
      // this.time.get();
      // this.subjects.get();
      // this.groups.get();
      // this.rooms.get();
      // this.timetable.get();
      this.loadDadesMestres();
      this.loadAbsencies();
      this.absences.get();
      this.loadGuardies();
      this.guards.getFromAbsence(); // Les meves absències.
      this.guards.getFromDate(); // Les del dia
      this.httpOptions['headers'] = this.httpOptions['headers'].set('Authorization', this.user.id.toString())
    }
    
  }

  userLogged() {
    if (this.username == ''){
      this.username = 'david';
      //this.httpOptions["context"] = new HttpContext().set(user, this.username);
      this.loadDadesMestres();
      this.loadAbsencies();
      this.loadGuardies();
    }
    return true;
  }

  creaUsuari(usuari: string, contrasenya: string): boolean {
    //console.log("crear l'usuari ", usuari, " amb pwd ", contrasenya);
    var peticio = {
      user: usuari,
      password: contrasenya
    };
    this.http.post<DadesMestres>(
        this.dadesMestresUrl, 
        JSON.stringify(peticio), 
        this.httpOptions
      ).pipe(
        catchError(this.handleError<DadesMestres>('Crear Usuari'))
      ).subscribe(usuari => this.dadesMestres = usuari);
    return true
  }

  loadDadesMestres(): void {
    var fh: any;
    this.franges_horaries.clear();
    this.espais.clear();
    this.grups.clear();
    this.materies.clear();
    this.horari.clear();
    this.llista_hores = [];
    this.llista_dies = [];
    this.llista_horesdies.clear();
    this.t3_horari.clear();
    this.http.get<DadesMestres>(this.dadesMestresUrl, this.httpOptions)
    .pipe(
      catchError(this.handleError<DadesMestres>('getLogin'))
    ).subscribe(dm => { 
                    console.log("incoming dm: ", dm);
                    this.dadesMestres = dm;
                    console.log ("dadesMestres carregue amb: ", this.dadesMestres);
                    //this.centres = dm.centres;
                    //this.usuaris = dm.usuaris;
                    // DEFINIM LA INTERFÍCIE D'ESPAIS I GRUPS, PERÒ NO SON ARRAYS!!!!
                    for ( var i in this.dadesMestres.franges_horaries) {
                      this.franges_horaries.set(i, this.dadesMestres.franges_horaries[i]);}
                    for ( var i in this.dadesMestres.espais){
                      this.espais.set(i, this.dadesMestres.espais[i]);}
                    for ( var i in this.dadesMestres.grups){
                      this.grups.set(i, this.dadesMestres.grups[i]);}
                    for ( var i in this.dadesMestres.materies){
                      this.materies.set(i, this.dadesMestres.materies[i]);}
                    for ( var i in this.dadesMestres.horari){
                      this.horari.set(this.dadesMestres.horari[i].id_franja.toString(), this.dadesMestres.horari[i]);}
                    for (var fhi in this.dadesMestres.franges_horaries) {
                      fh = this.dadesMestres.franges_horaries[fhi];
                       //console.log("franja: ", fh);

                      if ( this.llista_hores.indexOf(fh.hinici) == -1){
                        this.llista_hores.push(fh.hinici);
                        this.llista_horesdies.set(fh.hinici, new Map<string, number>());
                        //console.log("llista hores: ", this.llista_hores);
                        //console.log("llista horesdies: ", this.llista_horesdies);
                      }
                      if ( this.llista_dies.indexOf(fh.dia_setmana) == -1){
                        this.llista_dies.push(fh.dia_setmana);
                      }
                      this.llista_horesdies.get(fh.hinici).set(fh.dia_setmana, parseInt(fhi));
                      this.t3_horari.set(fhi.toString(),  this.carrega_text(fhi));
                    }
                    console.log("t3_horari és: ", this.t3_horari);
                });
  }

  loadAbsencies(){
    // this.http.get<Absencia[]>(this.absenciesUrl)
    //   .pipe(
    //     catchError(this.handleError<Absencia[]>('getAbsencies', [])))
    //   .subscribe( data => {
    //     console.log('processem les ', data.length, ' absenciesS');
    //     for (var i=0;i<data.length; i++){
    //       this.absencies.push ({
    //         id: data[i].id,
    //         data: this.str2date(data[i].data),
    //         data_fi: this.str2date(data[i].data_fi),
    //         hora_ini: this.str2time(data[i].hora_ini),
    //         hora_fi: this.str2time(data[i].hora_fi),
    //         dia_complet: data[i].dia_complet,
    //         extraescolar: data[i].extraescolar,
    //         justificada: data[i].justificada,
    //         guardies: data[i].guardies
    //       })    
    //     }
    //   })
  }



  loadGuardies(){

  }

  carrega_text (idh: string): string {
    //console.log("llista hores dies vull carregar ", this.aS.llista_hores[h], " ", this.aS.llista_dies[d]);
    var text = '';
    //console.log("carrega text de l'index ", idh, " a l'horari que té ", this.horari[idh]);
    if (this.horari.has(idh)){
      //console.log("està a l'horari")
      if (this.horari.get(idh).es_guardia){
        text = 'Guardia';
      } else {
        //console.log("grup id: ", this.aS.horari[idh]);
        //console.log(this.aS.grups, this.aS.espais, this.aS.materies);
        text = this.grups.get(this.horari.get(idh).grup_id.toString())+ ' ' +
              this.espais.get(this.horari.get(idh).espai_id.toString()) + ' \n' +
              this.materies.get(this.horari.get(idh).materia_id.toString());

      }
    }
    //console.log("carrega text de idh: ", idh, " retorne ", text);
    
    return text;

  }

  actualitza_horari(idh: string): void {
    // actualitza l'horari amb id_horari idh a la base de dades, segons la info de this.horari que està actualitzada.
    var url: string = BASE_URL + 'api/horari/'+idh+'/';
    var cos: string = JSON.stringify(this.horari.get(idh));
    console.log('horari stringify: ', cos)
    this.http.post<Horari>(url, cos, this.httpOptions)
      .pipe(
        catchError(this.handleError<Horari>('Actualitzar horari'))
      ).subscribe();
  }

  actualitza(tipus: string): void {
    // tipus pot ser grup, espai, matèria
    var url: string;
    var cos: string;
    if (tipus == 'grup') {
      url = BASE_URL + 'api/grups/';
      cos = JSON.stringify(Array.from(this.grups));
      console.log ('grups JSON: ', cos, this.grups); 
      this.http.post<Grup>(url, cos, this.httpOptions)
      .pipe(
        catchError(this.handleError<Grup>('Actualitzar '+tipus))
      ).subscribe();
    }
    if (tipus == 'espai') {
      url = BASE_URL + 'api/espais';
      cos = JSON.stringify(Array.from(this.espais));
      console.log ('grups JSON: ', cos, this.espais); 
      this.http.post<Espai>(url, cos, this.httpOptions)
      .pipe(
        catchError(this.handleError<Espai>('Actualitzar '+tipus))
      ).subscribe();
    }
    if (tipus == 'matèria') {
      url = BASE_URL + 'api/materies/';
      cos = JSON.stringify(Array.from(this.materies));
      console.log ('grups JSON: ', cos, this.materies); 
      this.http.post<Materia>(url, cos, this.httpOptions)
      .pipe(
        catchError(this.handleError<Materia>('Actualitzar '+tipus))
      ).subscribe();
    }

  }

  getLogin(): Observable<DadesMestres> {
    this.dadesMestres_obs = this.http.get<DadesMestres>(this.dadesMestresUrl, this.httpOptions)
      .pipe(
        catchError(this.handleError<DadesMestres>('getLogin'))
      );
    return this.dadesMestres_obs;
  }

  getAbsencies(): Observable<Absencia[]> {
    this.absencies_obs = this.http.get<Absencia[]>(this.absenciesUrl, this.httpOptions)
      .pipe(
        catchError(this.handleError<Absencia[]>('getAbsencies', []))
      );
    // console.log(this.absencies.length);
    //this.dates[this.absencies[0].guardies[0].data.toString()] = {};
    return this.absencies_obs;
  }

  getGuardies(): Observable<Guardia[]> {
    this.guardies_obs = this.http.get<Guardia[]>(this.guardiesUrl, this.httpOptions)
      .pipe(
        catchError((this.handleError<Guardia[]>('getGuardies', [])))
      );
    return this.guardies_obs;
  }

  updateAbsencia(id: number, objecte: AbsenciaS): Observable<any> {
    console.log('actualitzar absència de: ', objecte["data"] , " amb id ", id);
    console.log(JSON.stringify(objecte));
    return this.http.post<Absencia>(this.absenciesUrl, JSON.stringify(objecte), this.httpOptions)
      .pipe(
        catchError(this.handleError<Absencia>('Actualitzar usuari'))
      );
    
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of (result as T);
    };
  }

  date2str(valor: Date = null): string {
    console.log('vaig a convertir ', valor);
    //return format(valor, 'dd-MM-yyyy');
    if (valor == null){
      valor = new Date();
    }
    return format(valor, 'yyyy-MM-dd');
    console.log('vaig a convertir ', valor);
    return valor.toString();
  }
  str2date(valor: string): Date {
    return parseISO(valor);
  }
  time2str(valor: Date = new Date()): string {
    return '';
  }
  str2time(valor: string): Date{
    return new Date();
  }
  str2str(valor: string): string {
    var a = new Date();
    a = parseISO(valor);
    //return '';
    return this.date2str(a);
  }

}