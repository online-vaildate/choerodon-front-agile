import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';
import { asyncRouter } from 'choerodon-front-boot';

const ScrumBoardHome = asyncRouter(() => (import('./ScrumBoardHome')));
const ScrumBoardSetting = asyncRouter(() => (import('./ScrumBoardSetting')));

const ScrumBoardIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={ScrumBoardHome} />
    <Route path={`${match.url}/setting`} component={ScrumBoardSetting} />
  </Switch>
);

export default ScrumBoardIndex;
