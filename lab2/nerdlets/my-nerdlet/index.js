import React from 'react';
import { TableChart, Stack, StackItem, ChartGroup, LineChart, ScatterChart, Button, navigation, nerdlet, PlatformStateContext, NerdletStateContext, NrqlQuery } from 'nr1';

export default class Lab2Nerdlet extends React.Component {

    constructor(props) {
        super(props);
        this.accountId = 2529112;
        this.state = {
            entityGuid: null,
            appName: null
        };
        this.openEntity = this.openEntity.bind(this);
        console.debug("Nerdlet constructor", this); // eslint-disable-line
    }

    setApplicationGuid(inAppId, inAppName) {
        this.setState({ entityGuid: inAppId, appName: inAppName, appId: null });
    }

    openEntity() {
        const { entityGuid, appName } = this.state;
        nerdlet.setUrlState({ entityGuid, appName });
        navigation.openEntity(entityGuid);
    }

    render(){
        const { entityGuid, appName } = this.state;
        const nrql = `SELECT count(*) as 'transactions', apdex(duration) as 'apdex', percentile(duration, 99, 90, 70) FROM Transaction facet appName, entityGuid limit 25`;
        const trxOverT = `SELECT count(*) as 'transactions' FROM Transaction facet appName, appId limit 25 TIMESERIES`;
        const tCountNrql = `SELECT count(*) FROM Transaction WHERE entityGuid = '${entityGuid}' TIMESERIES`;
        const apdexNrql = `SELECT apdex(duration) FROM Transaction WHERE entityGuid = '${entityGuid}' TIMESERIES`;

        // return the JSX we're rendering
        return (
            <PlatformStateContext.Consumer>
              {(platformUrlState) => {
                  // console.debug here for learning purposes
                  console.debug(platformUrlState); // eslint-disable-line
                  const { duration } = platformUrlState.timeRange;
                  const since = ` SINCE ${duration/60/1000} MINUTES AGO`;
                  return (<ChartGroup>
                    <Stack
                        verticalType={Stack.VERTICAL_TYPE.FILL}
                        directionType={Stack.DIRECTION_TYPE.VERTICAL}
                        gapType={Stack.GAP_TYPE.EXTRA_LOOSE}>
                        <StackItem>
                            <Stack
                                horizontalType={Stack.HORIZONTAL_TYPE.FILL}
                                directionType={Stack.DIRECTION_TYPE.HORIZONTAL}
                                gapType={Stack.GAP_TYPE.EXTRA_LOOSE}>
                                <StackItem>
                                    <TableChart query={nrql + since} accountId={this.accountId} className="chart" onClickTable={(dataEl, row, chart) => {
                                    // for learning purposes, we'll write to the console.
                                    console.debug([dataEl, row, chart]) // eslint-disable-line
                                    this.setApplication(row.entityGuid, row.appName)
                                }}/>
                                </StackItem>
                                <StackItem>
                                    <LineChart
                                        query={trxOverT + since}
                                        className="chart"
                                        accountId={this.accountId}
                                        onClickLine={async (line) => {
                                            // more console logging for learning purposes
                                            console.debug(line); // eslint-disable=line
                                            const groups = line.metadata.groups;
                                            let appidobj = groups.find(g => g.name === "appId");
                                            let appnameobj = groups.find(g => g.name === "appName");
                                            if (appidobj && appnameobj) {
                                                // run a nrql query to get the entityGuid from the provided appName
                                                const res = await NrqlQuery.query({
                                                    accountId: this.accountId,
                                                    query: `SELECT entityGuid FROM Transaction WHERE appId = '${appidobj.value}' AND appName = '${appnameobj.value}' LIMIT 1`
                                                });
                                                console.debug(res);
                                                if (res && res.data.chart.length > 0 && res.data.chart[0].data.length > 0)
                                                    this.setApplicationGuid(res.data.chart[0].data[0].entityGuid, appnameobj.value);
                                            }
                                        }}
                                    />
                                </StackItem>
                            </Stack>
                        </StackItem>
                        <NerdletStateContext.Consumer>
                            {(nerdletUrlState) => {
                                if (entityGuid) {
                                    const tCountNrql = `SELECT count(*) FROM Transaction WHERE entityGuid = '${entityGuid}' TIMESERIES`;
                                    const apdexNrql = `SELECT apdex(duration) FROM Transaction WHERE entityGuid = '${entityGuid}' TIMESERIES`;

                                    return <React.Fragment>
                                        <StackItem>
                                            <Button onClick={this.openEntity}>Open {appName}</Button>
                                        </StackItem>
                                        <StackItem>
                                            <Stack
                                                directionType={Stack.DIRECTION_TYPE.HORIZONTAL}
                                                gapType={Stack.GAP_TYPE.EXTRA_LOOSE}>
                                                <StackItem>
                                                    <h2>Transaction counts for {appName}</h2>
                                                    <LineChart accountId={this.accountId} query={tCountNrql+since} className="chart"/>
                                                </StackItem>
                                                <StackItem>
                                                    <h2>Apdex for {appName}</h2>
                                                    <ScatterChart accountId={this.accountId} query={apdexNrql+since} className="chart"/>
                                                </StackItem>
                                            </Stack>
                                        </StackItem>
                                    </React.Fragment>
                                } else if (nerdletUrlState && nerdletUrlState.entityGuid) {
                                    const tCountNrql = `SELECT count(*) FROM Transaction WHERE entityGuid = '${nerdletUrlState.entityGuid}' TIMESERIES`;
                                    const apdexNrql = `SELECT apdex(duration) FROM Transaction WHERE entityGuid = '${nerdletUrlState.entityGuid}' TIMESERIES`;
                                    return <React.Fragment>
                                        <StackItem>
                                            <Button onClick={this.openEntity}>Open {nerdletUrlState.appName}</Button>
                                        </StackItem>
                                        <StackItem>
                                            <Stack
                                                directionType={Stack.DIRECTION_TYPE.HORIZONTAL}
                                                gapType={Stack.GAP_TYPE.EXTRA_LOOSE}>
                                                <StackItem>
                                                    <h2>Transaction counts for {nerdletUrlState.appName}</h2>
                                                    <LineChart accountId={this.accountId} query={tCountNrql+since} className="chart"/>
                                                </StackItem>
                                                <StackItem>
                                                    <h2>Apdex for {nerdletUrlState.appName}</h2>
                                                    <ScatterChart accountId={this.accountId} query={apdexNrql+since} className="chart"/>
                                                </StackItem>
                                            </Stack>
                                        </StackItem>
                                    </React.Fragment>
                                }
                                return null;
                            }}
                        </NerdletStateContext.Consumer>
                    </Stack>
                </ChartGroup>); //
              }}
            </PlatformStateContext.Consumer>
        );
    }
}