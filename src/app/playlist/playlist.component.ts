import { Component } from '@angular/core';
import { AppState } from '../app.service';

import { PlaylistService } from './playlist.service';

import * as YouTubePlayer from 'youtube-player';

import 'rxjs/add/operator/map';

import * as _ from 'underscore';

import { MenuItem } from 'primeng/api';

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'playlist',  // <home></home>
  // We need to tell Angular's Dependency Injection which providers are in our app.
  providers: [
    PlaylistService,
  ],
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: ['./playlist.style.scss'],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './playlist.template.html'
})
export class PlaylistComponent {

  private tubeApiConfig: {
    baseURL: string,
    maxResults: string,
    pageToken: string,
    part: string,
    playlistId: string,
    fields: string,
    key: string
  };
  private player = null;
  private playListBuffer;

  private playlist: object[];
  private leftHeight: string;

  private progressValue = 0;
  private progressDuration = new Date(1970, 0, 1);
  private progressCurrentTime = new Date(1970, 0, 1);

  private progressInterval;

  private playerStatus = 'notplaying';

  private hamburgermenu: MenuItem[];

  private changePlaylistUrlModal;

  // TypeScript public modifiers
  constructor(public appState: AppState,
    public playlistService: PlaylistService) {

    this.tubeApiConfig = {
      baseURL: 'https://content.googleapis.com/youtube/v3/playlistItems?',
      maxResults: '50',
      pageToken: '',
      part: 'snippet,contentDetails',
      playlistId: '',
      // tslint:disable-next-line:max-line-length
      fields: 'nextPageToken,items(snippet/title, snippet/thumbnails,contentDetails(videoId,startAt,endAt))',
      key: 'AIzaSyBmdqx5dDcczcPBa3PuoI2j2XVmxZiuRjo'
    };

    this.playlist = [];
    this.changePlaylistUrlModal = {
      show: false,
      tempModel: this.tubeApiConfig.playlistId,
      save: () => {
        this.tubeApiConfig.playlistId = this.changePlaylistUrlModal.tempModel;
        this.changePlaylistUrlModal.show = false;
        this.playlist = [];
        window.localStorage.setItem('szuflaTube',
          JSON.stringify({ playlistId: this.tubeApiConfig.playlistId }));
        this.tubeApiConfig.pageToken = '';
        this.getFullData(this.tubeApiConfig);
      }
    };

  }

  private ngOnInit() {
    this.leftHeight = window.innerHeight -
      document.getElementsByTagName('nav')[0].clientHeight - 10 + 'px';

    const localStorage = JSON.parse(window.localStorage.getItem('szuflaTube'));
    if (localStorage) {
      this.tubeApiConfig.playlistId = localStorage.playlistId;
      this.getFullData(this.tubeApiConfig);
    }

    this.playListBuffer = new PlaylistBuffer();

    this.player = YouTubePlayer('youtube__frame');

    this.hamburgermenu = [
      {
        label: '',
        icon: 'fa-bars',
        items: [{
          label: 'Change playlist url',
          icon: 'fa-edit',
          command: () => this.changePlaylistUrlModal.show = true
        },
        ]
      },
    ];

    this.player.on('stateChange', (event) => {
      if (this.playListBuffer.getPrevious() !== -1) {
        this.playerStatus = 'notplaying';
        this.playlist[this.playListBuffer.getPrevious()]['snippet'].thumbnails.overlayIcon = 'play';
      }
      switch (event.data) {
        case 1: {
          this.playerStatus = 'playing';
          this.playlist[this.playListBuffer.getCurrent()]['snippet'].thumbnails.overlayIcon = 'pause';
          this.progressInterval = setInterval(() => {
            this.player.getCurrentTime().then((currentTime) => {
              this.player.getDuration().then((duration) => {
                if (duration) {
                  this.progressValue = (currentTime / duration) * 100;

                  this.progressDuration = new Date(1970, 0, 1); // Epoch
                  this.progressDuration.setSeconds(duration);

                  this.progressCurrentTime = new Date(1970, 0, 1); // Epoch
                  this.progressCurrentTime.setSeconds(currentTime);
                }

              });

            });

          }, 100);
          break;
        }
        case 0: {
          this.next();
          break;
        }
        case 2: {
          this.playerStatus = 'notplaying';
          clearInterval(this.progressInterval);
          this.playlist[this.playListBuffer.getCurrent()]['snippet'].thumbnails.overlayIcon = 'play';
          break;
        }
      }
    });


    let progressBar = document.querySelector("p-progressBar");
    progressBar.addEventListener("click", (e: any) => {

      this.player.getDuration().then((duration) => {
        if (duration) {
          this.progressValue = Math.floor((e.offsetX / progressBar.clientWidth) * 100);
          this.player.seekTo(Math.floor((e.offsetX / progressBar.clientWidth) * duration));
        }

      })

    });




  }

  private playlistItemTileBehaviour(playlistItem, index) {
    if (this.playListBuffer.getCurrent() === index) {
      this.player.getPlayerState().then((res) => {
        //https://developers.google.com/youtube/iframe_api_reference#Functions
        switch (res) {
          case 1: {
            this.player.pauseVideo();
            break;
          }
          case 2:
          case 0: {
            this.player.playVideo();
            break;
          }
        }
      });
    }
    else {
      this.playListBuffer.add(index);
      this.player.loadVideoById(playlistItem.contentDetails.videoId);
      this.player.playVideo();
    }

  }

  private play() {
    if (this.tubeApiConfig.playlistId !== '') {
      if (this.playListBuffer.getCurrent() === -1) {
        this.playListBuffer.add(0);
        this.player.loadVideoById(this.playlist[0]['contentDetails'].videoId);
      }

      if (this.playerStatus === 'playing') {
        this.player.pauseVideo();
      } else {

        this.player.playVideo();
      }
    }

  }

  private next() {
    if (this.playListBuffer.getCurrent() + 1 < this.playlist.length) {
      this.player.loadVideoById(this.playlist[this.playListBuffer.getCurrent() + 1]
      ['contentDetails'].videoId);
      this.player.playVideo();
      this.playListBuffer.add(this.playListBuffer.getCurrent() + 1);
    }
  }

  private prev() {
    if (this.playListBuffer.getCurrent() - 1 >= 0) {
      this.player.loadVideoById(this.playlist[this.playListBuffer.getCurrent() - 1]
      ['contentDetails'].videoId);
      this.player.playVideo();
      this.playListBuffer.add(this.playListBuffer.getCurrent() - 1);
    }

  }

  private shufflePlaylist() {
    const actucallState = this.playerStatus;
    this.playlist = _.shuffle(this.playlist);
    this.playListBuffer.add(-1);
    this.playListBuffer.add(0);
    this.player.loadVideoById(this.playlist[this.playListBuffer.getCurrent()]
    ['contentDetails'].videoId);

    if (actucallState === 'playing') {
      this.player.playVideo();
    } else {
      this.player.stopVideo();
    }

    this.progressValue = 0;
    this.progressDuration = new Date(1970, 0, 1);
    this.progressCurrentTime = new Date(1970, 0, 1);
  }

  private getFullData(config, data: object[] = []) {

    this.playlistService.getData(config).subscribe((res: any) => {

      if (res.nextPageToken) {
        config.pageToken = res.nextPageToken;
        this.playlist = this.playlist.concat(res.items);
        return this.getFullData(config, data);
      } else {
        this.playlist = this.playlist.concat(res.items);
        console.log(this.playlist);
        return true;
      }

    });

  }

}

class PlaylistBuffer {
  private buffer = [-1, -1];
  constructor() { }

  public add(index) {
    if (this.buffer.length > 1) {
      this.buffer.shift();
    }
    this.buffer.push(index)
  }

  public getPrevious() {
    return this.buffer[0];
  }
  public getCurrent() {
    return this.buffer[1];
  }
}
