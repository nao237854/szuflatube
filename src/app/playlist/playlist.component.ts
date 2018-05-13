import { Component, Inject } from '@angular/core';
import { AppState } from '../app.service';
import { DOCUMENT } from '@angular/common';

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
              public playlistService: PlaylistService,
              @Inject(DOCUMENT) document) {

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

  }

  private ngOnInit() {
    this.leftHeight = window.innerHeight -
      document.getElementsByTagName('nav')[0].clientHeight - 10 + 'px';

    const localStorage = JSON.parse(window.localStorage.getItem('szuflaTube'));
    if (localStorage) {
      this.tubeApiConfig.playlistId = localStorage.playlistId;
      this.getFullData(this.tubeApiConfig);
    }

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
        this.playListBuffer.reset();
      }
    };

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
      if (this.playListBuffer.getPrevious().index !== -1 && 
      this.playListBuffer.getPrevious().index !== this.playListBuffer.getCurrent().index) {
        this.playerStatus = 'notplaying';
        this.playlist[this.playListBuffer.getPrevious().index]
        ['state'] = 'notplaying';
      }
      switch (event.data) {
        case 1: {
          this.playerStatus = 'playing';
          this.playlist[this.playListBuffer.getCurrent().index]
          ['state'] = 'playing';

          const nextItem: any = document.getElementById(this.playListBuffer.getCurrent().
          playlistItem.contentDetails.videoId);

          nextItem.scrollIntoView(true);

          const playlistItems = document.querySelector('.ui-datascroller-content');
          playlistItems.scrollTop -= window.innerHeight / 2 - nextItem.clientHeight;

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
          this.playlist[this.playListBuffer.getCurrent().index]
          ['state'] = 'paused';
          break;
        }
      }
    });

    const progressBar = document.querySelector('p-progressBar');
    progressBar.addEventListener('click', (e: any) => {

      this.player.getDuration().then((duration) => {
        if (duration) {
          this.progressValue = Math.floor((e.offsetX / progressBar.clientWidth) * 100);
          this.player.seekTo(Math.floor((e.offsetX / progressBar.clientWidth) * duration));
        }

      });

    });

  }

  private playlistItemTileBehaviour(playlistItem, index) {
    if (this.playListBuffer.getCurrent().index === index) {
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
    } else {
      this.playListBuffer.add({ playlistItem: this.playlist[index], index });
      this.player.loadVideoById(playlistItem.contentDetails.videoId);
      this.player.playVideo();
    }

  }

  private play() {
    if (this.tubeApiConfig.playlistId !== '') {
      if (this.playListBuffer.getCurrent().index === -1) {
        this.playListBuffer.add({ playlistItem: this.playlist[0], index: 0 });
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
    if (this.playListBuffer.getCurrent().index + 1 < this.playlist.length) {
      this.player.loadVideoById(this.playlist[this.playListBuffer.getCurrent().index + 1]
      ['contentDetails'].videoId);
      this.player.playVideo();
      this.playListBuffer.add({
        playlistItem: this.playlist[this.playListBuffer.getCurrent().index + 1],
        index: this.playListBuffer.getCurrent().index + 1
      });
    }
  }

  private prev() {
    if (this.playListBuffer.getCurrent().index - 1 >= 0) {
      this.player.loadVideoById(this.playlist[this.playListBuffer.getCurrent().index - 1]
      ['contentDetails'].videoId);
      this.player.playVideo();
      this.playListBuffer.add({
        playlistItem: this.playlist[this.playListBuffer.getCurrent().index - 1],
        index: this.playListBuffer.getCurrent().index - 1
      });
    }

  }

  private shufflePlaylist() {
    const actucallState = this.playerStatus;
    this.playlist = _.shuffle(this.playlist);
    this.playListBuffer.reset();
    this.playListBuffer.add({ playlistItem: this.playlist[0], index: 0 });
    this.player.loadVideoById(this.playlist[this.playListBuffer.getCurrent().index]
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
        if (this.playerStatus === 'playing') {
          this.player.loadVideoById(this.playlist[0]['contentDetails'].videoId);
          this.player.playVideo();
        }
        this.playlist = this.playlist.concat(res.items);
        console.log(this.playlist);
        return true;
      }

    });

  }

}

// tslint:disable-next-line:max-classes-per-file
class PlaylistBuffer {
  private buffer;
  constructor() {
    this.buffer = [{ playlistItem: null, index: -1 }, { playlistItem: null, index: -1 }];
  }

  public add(index) {
    if (this.buffer.length > 1) {
      this.buffer.shift();
    }
    this.buffer.push(index);
  }

  public getPrevious() {
    return this.buffer[0];
  }
  public getCurrent() {
    return this.buffer[1];
  }
  public reset() {
    this.buffer = [{ playlistItem: null, index: -1 }, { playlistItem: null, index: -1 }];
  }
}
