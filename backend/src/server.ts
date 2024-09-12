import App from './app';
import { StakeRoute } from './routes/stake.route';
import { IndexRoute } from './routes/index.route';
// -------------

const app = new App([new IndexRoute(), new StakeRoute()]);

app.listen();
