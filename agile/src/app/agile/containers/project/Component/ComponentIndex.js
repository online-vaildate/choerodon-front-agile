import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter } from 'choerodon-front-boot';

const ComponentHome = asyncRouter(() => import('./ComponentHome'));

const ComponentIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={ComponentHome} />
  </Switch>
);

export default ComponentIndex;
