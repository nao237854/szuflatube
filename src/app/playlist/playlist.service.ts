import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as _ from 'underscore';

@Injectable()
export class PlaylistService {
    constructor(public http: HttpClient) {
    }

    getData(config:Object) {

        
        let tmpConfig = _.clone(config);
        let url = tmpConfig['baseURL'];


        delete tmpConfig['baseURL']; 

        url += Object.keys(tmpConfig)[0] + '=' + tmpConfig[Object.keys(tmpConfig)[0]];

        delete Object.keys(tmpConfig)[0];
       
        
        Object.keys(tmpConfig).forEach(function (key) {

            console.log(key, tmpConfig[key]);
            url += '&' + key + '=' + tmpConfig[key]

        });

         console.log("URL", url)

        // return this.http.get('/assets/mock-data/mock-data.json')
        //     .map(res => res.json());





        return this.http.get(url).map((response:any) => {
            console.log(response);
            return response
        });

        
           


    }

}