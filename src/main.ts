//main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideEventPlugins } from '@taiga-ui/event-plugins';
import { CleanPage } from './clean-page/clean-page';

bootstrapApplication(CleanPage, {
  providers: [
    provideAnimations(),
    provideEventPlugins(),
  ],
}).catch(err => console.error(err));
