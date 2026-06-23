import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ModuleRegistry } from 'ag-grid-community';
import { SetFilterModule } from 'ag-grid-enterprise';

// ✅ This should now work with matching versions
ModuleRegistry.registerModules([SetFilterModule]);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));