import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import _ from 'lodash';
import { Page, Header, Content, stores } from 'choerodon-front-boot';
import { Table, Button, Select, Popover, Tabs, Tooltip, Input, Dropdown, Menu, Pagination, Spin, Icon } from 'choerodon-ui';

import '../../../main.scss';
import './Issue.scss';

import IssueStore from '../../../../stores/project/sprint/IssueStore';

import { STATUS, COLOR, TYPE, ICON, TYPE_NAME } from '../../../../common/Constant';
import pic from '../../../../assets/image/问题管理－空.png';
import { loadIssue, createIssue } from '../../../../api/NewIssueApi';
import EditIssue from '../../../../components/EditIssueWide';
import CreateIssue from '../../../../components/CreateIssueNew';
import DailyLog from '../../../../components/DailyLog';
import EmptyBlock from '../../../../components/EmptyBlock';
import { ReadAndEdit } from '../../../../components/CommonComponent';

const Option = Select.Option;
const TabPane = Tabs.TabPane;
const { AppState } = stores;

@observer
class Issue extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expand: false,
      create: false,
      selectedIssue: {},
      createIssue: false,
      selectIssueType: 'task',
      createIssueValue: '',
    };
  }
  componentDidMount() {
    IssueStore.init();
  }

  handleCreateIssue(issueObj) {
    this.setState({ create: false });
    IssueStore.init();
  }

  handleChangeIssueId(issueId) {
    this.setState({
      expand: false,
    }, () => {
      this.setState({
        selectedIssue: {
          issueId,
        },
        expand: true,
      });
    });
  }

  handleIssueUpdate(issueId = this.state.selectedIssue.issueId) {
    loadIssue(issueId).then((res) => {
      const obj = {
        assigneeId: res.assigneeId,
        assigneeName: res.assigneeName,
        imageUrl: res.imageUrl || '',
        issueId: res.issueId,
        issueNum: res.issueNum,
        priorityCode: res.priorityCode,
        priorityName: res.priorityName,
        projectId: res.projectId,
        statusCode: res.statusCode,
        statusColor: res.statusColor,
        statusName: res.statusName,
        summary: res.summary,
        typeCode: res.typeCode,
      };
      const originIssues = _.slice(IssueStore.issues);
      const index = _.findIndex(originIssues, { issueId: res.issueId });
      originIssues[index] = obj;
      IssueStore.setIssues(originIssues);
    });
  }

  handleBlurCreateIssue() {
    if (this.state.createIssueValue !== '') {
      const data = {
        priorityCode: 'medium',
        projectId: AppState.currentMenuType.id,
        sprintId: 0,
        summary: this.state.createIssueValue,
        typeCode: this.state.selectIssueType,
        epicId: 0,
        parentIssueId: 0,
      };
      createIssue(data)
        .then((res) => {
          IssueStore.init();
          this.setState({
            // createIssue: false,
            createIssueValue: '',
          });
        })
        .catch((error) => {
        });
    }
  }

  handleChangeType({ key }) {
    this.setState({
      selectIssueType: key,
    });
  }

  handleSort({ key }) {
    const currentSort = IssueStore.order;
    const targetSort = {};
    if (currentSort.orderField === key) {
      targetSort.orderField = key;
      if (currentSort.orderType !== 'desc') {
        targetSort.orderType = 'desc';
      } else {
        targetSort.orderType = 'asc';
      }
    } else {
      targetSort.orderField = key;
      targetSort.orderType = 'desc';
    }
    IssueStore.setOrder(targetSort);
    const { current, pageSize } = IssueStore.pagination;
    IssueStore.loadIssues(current - 1, pageSize);
  }

  handlePaginationChange(page, pageSize) {
    IssueStore.loadIssues(page - 1, pageSize);
  }

  handlePaginationShowSizeChange(current, size) {
    IssueStore.loadIssues(current - 1, size);
  }

  handleFilterChange = (pagination, filters, sorter, param) => {
    const obj = {
      advancedSearchArgs: {},
      searchArgs: {},
    };
    const { statusCode, priorityCode, typeCode } = filters;
    const { issueNum, summary } = filters;
    obj.advancedSearchArgs.statusCode = statusCode || [];
    obj.advancedSearchArgs.priorityCode = priorityCode || [];
    obj.advancedSearchArgs.typeCode = typeCode || [];
    obj.searchArgs.issueNum = issueNum && issueNum.length ? issueNum[0] : '';
    obj.searchArgs.summary = summary && summary.length ? summary[0] : '';
    IssueStore.setFilter(obj);
    const { current, pageSize } = IssueStore.pagination;
    IssueStore.loadIssues(current - 1, pageSize);
  }

  renderWideIssue(issue) {
    return (
      <div style={{ display: 'flex', flex: 1, marginTop: '3px', marginBottom: '3px', cursor: 'pointer' }}>
        <Tooltip mouseEnterDelay={0.5} title={`任务类型： ${TYPE_NAME[issue.typeCode]}`}>
          <div
            className="c7n-sign"
            style={{
              backgroundColor: TYPE[issue.typeCode],
            }}
          >
            <Icon
              style={{ fontSize: '14px' }}
              type={ICON[issue.typeCode]}
            />
          </div>
        </Tooltip>
        <Tooltip mouseEnterDelay={0.5} title={`任务编号： ${issue.issueNum}`}>
          <a style={{ paddingLeft: 12, paddingRight: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {issue.issueNum}
          </a>
        </Tooltip>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <Tooltip mouseEnterDelay={0.5} placement="topLeft" title={`任务概要： ${issue.summary}`}>
            <p style={{ paddingRight: '25px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 0, maxWidth: 'unset' }}>
              {issue.summary}
            </p>
          </Tooltip>
        </div>

        <div style={{ flexShrink: '0' }}>
          <Tooltip mouseEnterDelay={0.5} title={`优先级： ${issue.priorityName}`}>
            <div
              className="c7n-level"
              style={{
                backgroundColor: COLOR[issue.priorityCode].bgColor,
                color: COLOR[issue.priorityCode].color,
              }}
            >
              { issue.priorityName }
            </div>
          </Tooltip>
        </div>
        <div style={{ flexShrink: '0' }}>
          {
            issue.assigneeId ? (
              <Tooltip mouseEnterDelay={0.5} title={`任务经办人： ${issue.assigneeName}`}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    className="c7n-avator"
                    style={{
                      flexShrink: 0,
                      marginLeft: 12,
                    }}
                  >
                    {issue.assigneeName ? issue.assigneeName.slice(0, 1) : ''}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {`${issue.assigneeId} ${issue.assigneeName}`}
                  </span>
                </div>
              </Tooltip>
            ) : null
          }
        </div>
        <div style={{ flexShrink: '0', display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip mouseEnterDelay={0.5} title={`任务状态： ${issue.statusName}`}>
            <div
              className="c7n-status"
              style={{
                background: issue.statusColor,
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginLeft: 12,
              }}
            >
              { issue.statusName }
            </div>
          </Tooltip>
        </div>
      </div>
    );
  }

  renderNarrowIssue(issue) {
    return (
      <div style={{ marginTop: '5px', marginBottom: '5px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', marginBottom: '5px', width: '100%', flex: 1 }}>
          <Tooltip mouseEnterDelay={0.5} title={`任务类型： ${TYPE_NAME[issue.typeCode]}`}>
            <div
              className="c7n-sign"
              style={{
                backgroundColor: TYPE[issue.typeCode],
                marginRight: '5px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon
                style={{ fontSize: '14px' }}
                type={ICON[issue.typeCode]}
              />
            </div>
          </Tooltip>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Tooltip mouseEnterDelay={0.5} placement="topLeft" title={`任务概要： ${issue.summary}`}>
              <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 0 }}>
                {issue.summary}
              </p>
            </Tooltip>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex' }}>
            <Tooltip mouseEnterDelay={0.5} title={`任务优先级： ${issue.priorityName}`}>
              <div
                className="c7n-level"
                style={{
                  backgroundColor: COLOR[issue.priorityCode].bgColor,
                  color: COLOR[issue.priorityCode].color,
                  marginRight: '12px',
                }}
              >
                { issue.priorityName }
              </div>
            </Tooltip>
            <div style={{ width: '140px', flexShrink: '0' }}>
              {
                issue.assigneeId ? (
                  <Tooltip mouseEnterDelay={0.5} title={`任务经办人： ${issue.assigneeName}`}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span
                        className="c7n-avator"
                        style={{ flexShrink: 0 }}
                      >
                        {issue.assigneeName ? issue.assigneeName.slice(0, 1) : ''}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {`${issue.assigneeId} ${issue.assigneeName}`}
                      </span>
                    </div>
                  </Tooltip>
                ) : null
              }
            </div>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <Tooltip mouseEnterDelay={0.5} placement="topLeft" title={`任务类型： ${issue.statusName}`}>
              <div
                className="c7n-status"
                style={{
                  background: issue.statusColor,
                  color: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                { issue.statusName }
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const ORDER = [
      {
        code: 'summary',
        showName: '问题名称',
      },
      {
        code: 'typeCode',
        showName: '问题类型',
      },
      {
        code: 'priorityCode',
        showName: '问题优先级',
      },
      {
        code: 'statusId',
        showName: '问题状态',
      },
      {
        code: 'assigneeId',
        showName: '经办人',
      },
    ];
    const filterColumns = [
      {
        title: '类型',
        dataIndex: 'typeCode',
        key: 'typeCode',
        filters: [
          {
            text: '故事',
            value: 'story',
          },
          {
            text: '任务',
            value: 'task',
          },
          {
            text: '故障',
            value: 'bug',
          },
          {
            text: '史诗',
            value: 'issue_epic',
          },
        ],
        filterMultiple: true,
      },
      {
        title: '编号',
        dataIndex: 'issueNum',
        key: 'issueNum',
        filters: [],
      },
      {
        title: '概要',
        dataIndex: 'summary',
        key: 'summary',
        filters: [],
      },
      {
        title: '优先级',
        dataIndex: 'priorityCode',
        key: 'priorityCode',
        filters: [
          {
            text: '高',
            value: 'high',
          },
          {
            text: '中',
            value: 'medium',
          },
          {
            text: '低',
            value: 'low',
          },
        ],
        filterMultiple: true,
      },
      {
        title: '状态',
        dataIndex: 'statusCode',
        key: 'statusCode',
        filters: [
          {
            text: '待处理',
            value: 'todo',
          },
          {
            text: '进行中',
            value: 'doing',
          },
          {
            text: '已完成',
            value: 'done',
          },
        ],
        filterMultiple: true,
      },
    ];
    const columns = [
      {
        title: 'summary',
        dataIndex: 'summary',
        render: (summary, record) => (
          !this.state.expand ? this.renderWideIssue(record) : this.renderNarrowIssue(record)
        ),
      },
    ];
    const sort = (
      <Menu onClick={this.handleSort.bind(this)}>
        {
          ORDER.map(v => (
            <Menu.Item key={v.code}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: IssueStore.order.orderField === v.code ? 'blue' : '#000',
                }}
              >
                <span style={{ width: 100 }}>
                  {v.showName}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Icon
                    type="arrow_drop_up"
                    style={{
                      lineHeight: 0.5,
                      color: IssueStore.order.orderField === v.code && IssueStore.order.orderType === 'asc' ? 'blue' : '#000',
                    }}
                  />
                  <Icon
                    type="arrow_drop_down"
                    style={{
                      lineHeight: 0.5,
                      color: IssueStore.order.orderField === v.code && IssueStore.order.orderType === 'desc' ? 'blue' : '#000',
                    }}
                  />
                </div>
              </div>
            </Menu.Item>
          ))
        }
        
      </Menu>
    );
    const typeList = (
      <Menu
        style={{
          background: '#fff',
          boxShadow: '0 5px 5px -3px rgba(0, 0, 0, 0.20), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12)',
          borderRadius: '2px',
        }}
        onClick={this.handleChangeType.bind(this)}
      >
        {
          ['story', 'task', 'bug', 'issue_epic'].map(type => (
            <Menu.Item key={type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    backgroundColor: TYPE[type],
                    marginRight: 8,
                    display: 'inline-block',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    textAlign: 'center',
                    color: '#fff',
                    lineHeight: '16px',
                  }}
                >
                  <Icon
                    style={{ fontSize: '14px' }}
                    type={ICON[type]}
                  />
                </div>
                <span>
                  {TYPE_NAME[type]}
                </span>
              </div>
            </Menu.Item>
          ))
        }
      </Menu>
    );
    
    return (
      <Page className="c7n-Issue c7n-region">

        <Header title="问题管理">
          <Button className="leftBtn" funcTyp="flat" onClick={() => this.setState({ create: true })}>
            <Icon type="playlist_add icon" />
            <span>创建问题</span>
          </Button>
          <Button
            funcTyp="flat"
            onClick={() => {
              const { current, pageSize } = IssueStore.pagination;
              IssueStore.loadIssues(current - 1, pageSize);
            }}
          >
            <Icon type="autorenew icon" />
            <span>刷新</span>
          </Button>
        </Header>

        <Content style={{ display: 'flex', padding: '0' }}>
          {/* <Spin spinning={IssueStore.loading}> */}
          <div 
            className="c7n-content-issue" 
            style={{
              width: this.state.expand ? '33%' : '100%',
              display: 'block',
              overflowY: 'scroll',
              overflowX: 'hidden',
            }}
          >
            <section className="c7n-bar">
              <Table
                rowKey={record => record.id}
                columns={filterColumns}
                dataSource={[]}
                filterBar
                showHeader={false}
                onChange={this.handleFilterChange}
                pagination={false}
              />
            </section>
            <section className="c7n-count">
              <span className="c7n-span-count">共{IssueStore.pagination.total}条任务</span>
              <Dropdown overlay={sort} trigger={['click']}>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', lineHeight: '20px', cursor: 'pointer', position: 'absolute', right: 25, bottom: 28 }}>
                  <Icon type="swap_vert" style={{ fontSize: '16px', marginRight: '5px' }} />
                  <span>排序</span>
                </div>
              </Dropdown>
            </section>
            <section
              className={`c7n-table ${this.state.expand ? 'expand-sign' : ''}`}
              style={{
                paddingRight: this.state.expand ? '0' : '24px',
                boxSizing: 'border-box',
                width: '100%',
              }}
            >
              {
                IssueStore.issues.length === 0 && !IssueStore.loading ? (
                  <EmptyBlock
                    style={{ marginTop: 40 }}
                    border
                    pic={pic}
                    title="根据当前搜索条件没有查询到问题"
                    des="尝试修改您的过滤选项或者在下面创建新的问题"
                  />
                ) : (
                  <Table
                    rowKey={record => record.id}
                    columns={columns}
                    dataSource={_.slice(IssueStore.issues)}
                    filterBar={false}
                    showHeader={false}
                    scroll={{ x: true }}
                    loading={IssueStore.loading}
                    onChange={this.handleTableChange}
                    pagination={false}
                    onRow={record => ({
                      onClick: () => {
                        this.setState({
                          expand: false,
                        }, () => {
                          this.setState({
                            selectedIssue: record,
                            expand: true,
                          });
                        });
                      },
                    })
                    }
                    rowClassName={(record, index) => (
                      record.issueId === this.state.selectedIssue.issueId ? 'c7n-border-visible' : 'c7n-border')}
                  />
                )
              }
              
              <div className="c7n-backlog-sprintIssue">
                <div
                  style={{
                    userSelect: 'none',
                    background: 'white',  
                    padding: '12px 0 12px 20px',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    // height: 80,
                    borderBottom: '1px solid #e8e8e8',
                  }}
                >
                  {this.state.createIssue ? (
                    <div className="c7n-add" style={{ display: 'block', width: '100%' }}>
                      <div style={{ display: 'flex' }}>
                        <Dropdown overlay={typeList} trigger={['click']}>
                          <div style={{ display: 'flex', alignItem: 'center' }}>
                            <div
                              className="c7n-sign"
                              style={{
                                backgroundColor: TYPE[this.state.selectIssueType],
                                marginRight: 2,
                              }}
                            >
                              <Icon
                                style={{ fontSize: '14px' }}
                                type={ICON[this.state.selectIssueType]}
                              />
                            </div>
                            <Icon
                              type="arrow_drop_down"
                              style={{ fontSize: 16 }}
                            />
                          </div>
                        </Dropdown>
                        <div style={{ marginLeft: 8, flexGrow: 1 }}>
                          <Input
                            autoFocus
                            value={this.state.createIssueValue}
                            placeholder="需要做什么"
                            onChange={(e) => {
                              this.setState({
                                createIssueValue: e.target.value,
                              });
                            }}
                            maxLength={30}
                            onPressEnter={this.handleBlurCreateIssue.bind(this)}
                            // onBlur={this.handleBlurCreateIssue.bind(this)}
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', marginLeft: 50, paddingRight: 70 }}>
                        <Button 
                          type="primary"
                          onClick={() => {
                            this.setState({
                              createIssue: false,
                            });
                          }}
                        >取消</Button>
                        <Button
                          type="primary"
                          onClick={this.handleBlurCreateIssue.bind(this)}
                        >确定</Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="leftBtn"
                      style={{ color: '#3f51b5' }}
                      funcTyp="flat"
                      onClick={() => {
                        this.setState({ 
                          createIssue: true,
                          createIssueValue: '',
                        });
                      }}
                    >
                      <Icon type="playlist_add icon" />
                      <span>创建问题</span>
                    </Button>
                  )}
                  {/* <div
                    className="c7n-backlog-sprintIssueSide"
                    style={{ color: '#3f51b5', cursor: 'pointer' }}
                    role="none"
                    onClick={() => {
                      this.setState({
                        createIssue: true,
                      });
                    }}
                  >
                    <Icon
                      className="c7n-backlog-createIssue"
                      type="playlist_add"
                    >创建问题</Icon>
                  </div> */}
                </div>
              </div>
              {
                IssueStore.issues.length !== 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, marginBottom: 16 }}>
                    <Pagination
                      current={IssueStore.pagination.current}
                      defaultCurrent={1}
                      defaultPageSize={10}
                      pageSize={IssueStore.pagination.pageSize}
                      showSizeChanger
                      total={IssueStore.pagination.total}
                      onChange={this.handlePaginationChange.bind(this)}
                      onShowSizeChange={this.handlePaginationShowSizeChange.bind(this)}
                    />
                  </div>
                ) : null
              }
            </section>
          </div>

          <div
            className="c7n-sidebar"
            style={{
              width: this.state.expand ? '67%' : 0,
              display: this.state.expand ? 'block' : 'none',
              overflowY: 'hidden',
              overflowX: 'hidden',
            }}
          >
            {
              this.state.expand && <EditIssue
                issueId={this.state.selectedIssue.issueId}
                changeIssueId={this.handleChangeIssueId.bind(this)}
                onCancel={() => {
                  this.setState({
                    expand: false,
                    selectedIssue: {},
                  });
                }}
                onDeleteIssue={() => {
                  this.setState({
                    expand: false,
                    selectedIssue: {},
                  });
                  IssueStore.init();
                }}
                onUpdate={this.handleIssueUpdate.bind(this)}
              />
            }
          </div>
          {/* </Spin> */}
          {
            this.state.create ? (
              <CreateIssue
                visible={this.state.create}
                onCancel={() => this.setState({ create: false })}
                onOk={this.handleCreateIssue.bind(this)}
                
              />
            ) : null
          }
        </Content>
      </Page>
    );
  }
}
export default Issue;
