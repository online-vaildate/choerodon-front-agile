import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import _ from 'lodash';
import moment from 'moment';
import { stores } from 'choerodon-front-boot';
import { Input, DatePicker, Icon } from 'choerodon-ui';
import BacklogStore from '../../../../../stores/project/backlog/BacklogStore';
import EasyEdit from '../../../../../components/EasyEdit/EasyEdit';

const { AppState } = stores;

@observer
class VersionItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editDescription: false,
      editName: false,
      editStartDate: false,
      editEndDate: false,
      hoverBlockEditName: false,
      hoverBlockEditDes: false,
    };
  }
  handleClickName(e) {
    e.stopPropagation();
    this.setState({
      editName: true,
    });
  }
  handleClickDes(e) {
    e.stopPropagation();
    this.setState({
      editDescription: true,
    });
  }
  handleOnBlurDes(value) {
    const data = {
      objectVersionNumber: this.props.data.objectVersionNumber,
      projectId: parseInt(AppState.currentMenuType.id, 10),
      versionId: this.props.data.versionId,
      description: value,
    };
    BacklogStore.axiosUpdateVerison(this.props.data.versionId, data).then((res) => {
      this.setState({
        editDescription: false,
      });
      const originData = _.clone(BacklogStore.getVersionData);
      originData[this.props.index].description = res.description;
      originData[this.props.index].objectVersionNumber = res.objectVersionNumber;
      BacklogStore.setVersionData(originData);
    }).catch((error) => {
      this.setState({
        editDescription: false,
      });
      window.console.log(error);
    });
  }
  handleBlurName(e) {
    const data = {
      objectVersionNumber: this.props.data.objectVersionNumber,
      projectId: parseInt(AppState.currentMenuType.id, 10),
      versionId: this.props.data.versionId,
      name: e.target.value,
    };
    BacklogStore.axiosUpdateVerison(this.props.data.versionId, data).then((res) => {
      this.setState({
        editName: false,
      });
      const originData = _.clone(BacklogStore.getVersionData);
      originData[this.props.index].name = res.name;
      originData[this.props.index].objectVersionNumber = res.objectVersionNumber;
      BacklogStore.setVersionData(originData);
    }).catch((error) => {
      this.setState({
        editName: false,
      });
      window.console.log(error);
    });
  }
  updateDate(type, date2) {
    let date = date2;
    const data = {
      objectVersionNumber: this.props.data.objectVersionNumber,
      projectId: parseInt(AppState.currentMenuType.id, 10),
      versionId: this.props.data.versionId,
      [type]: date ? date += ' 00:00:00' : null,
    };
    BacklogStore.axiosUpdateVerison(this.props.data.versionId, data).then((res) => {
      const originData = _.clone(BacklogStore.getVersionData);
      originData[this.props.index][type] = res[type];
      originData[this.props.index].objectVersionNumber = res.objectVersionNumber;
      BacklogStore.setVersionData(originData);
    }).catch((error) => {
      window.console.log(error);
    });
  }
  render() {
    const item = this.props.data;
    const index = this.props.index;
    return (
      <div 
        className={BacklogStore.getIsDragging ? 'c7n-backlog-versionItems c7n-backlog-dragToVersion' : 'c7n-backlog-versionItems'}
        style={{
          background: BacklogStore.getChosenVersion === item.versionId ? 'rgba(140, 158, 255, 0.08)' : '',
          paddingLeft: 0,
        }}
        role="none"
        onClick={this.props.handelClickVersion.bind(this, item.versionId)}
        onMouseEnter={() => {
          this.setState({
            hoverBlockEditName: true,
          });
        }}
        onMouseLeave={() => {
          this.setState({
            hoverBlockEditName: false,
          });
        }}
        onMouseUp={() => {
          if (BacklogStore.getIsDragging) {
            BacklogStore.axiosUpdateIssuesToVersion(
              item.versionId, this.props.draggableIds).then((res) => {
              this.props.refresh();
            }).catch((error) => {
              window.console.log(error);
              this.props.refresh();
            });
          }
        }}
      >
        <div className="c7n-backlog-versionItemTitle">
          <Icon
            type={item.expand ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
            role="none"
            onClick={(e) => {
              const data = BacklogStore.getVersionData;
              e.stopPropagation();
              data[index].expand = !data[index].expand;
              BacklogStore.setVersionData(data);
            }}
          />
          {this.state.editName ? (
            <Input 
              maxLength={30} 
              defaultValue={item.name} 
              autoFocus 
              onPressEnter={this.handleBlurName.bind(this)}
              onBlur={this.handleBlurName.bind(this)}
            />
          ) : (
            <div className="c7n-backlog-versionItemTitleName">
              <p>{item.name}</p>
              <Icon
                style={{ 
                  fontSize: 13,
                  display: this.state.hoverBlockEditName ? 'block' : 'none',
                }}
                role="none"
                onClick={this.handleClickName.bind(this)} 
                type="mode_edit"
              />
            </div>
          )}
        </div>
        {item.expand ? (
          <div style={{ paddingLeft: 12 }}>
            <div
              style={{ marginTop: 12 }}
              onMouseEnter={() => {
                this.setState({
                  hoverBlockEditDes: true,
                });
              }}
              onMouseLeave={() => {
                this.setState({
                  hoverBlockEditDes: false,
                });
              }}
            >
              <EasyEdit
                type="input"
                defaultValue={item.description}
                enterOrBlur={this.handleOnBlurDes.bind(this)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="c7n-backlog-versionItemDes">
                    {!item.description ? '没有描述' : item.description}
                  </p>
                </div>
              </EasyEdit>
            </div>
            <p className="c7n-backlog-versionItemDetail">详情</p>
            <div className="c7n-backlog-versionItemParams">
              <div className="c7n-backlog-versionItemParam">
                <p style={{ color: 'rgba(0,0,0,0.65)' }}>开始日期</p>
                <EasyEdit
                  type="date"
                  defaultValue={item.startDate ? moment(item.startDate.split(' ')[0], 'YYYY-MM-DD') : ''}
                  disabledDate={item.releaseDate ? current => current > moment(item.releaseDate, 'YYYY-MM-DD HH:mm:ss') : ''}
                  onChange={(date, dateString) => {
                    this.updateDate('startDate', dateString);
                  }}
                >
                  <p>{!_.isNull(item.startDate) ? `${item.startDate.split('-')[2].substring(0, 2)}/${item.startDate.split('-')[1]}/${item.startDate.split('-')[0].substring(2, 4)}` : '无'}</p>
                </EasyEdit>
              </div>
              <div className="c7n-backlog-versionItemParam">
                <p style={{ color: 'rgba(0,0,0,0.65)' }}>发布日期</p>
                <EasyEdit
                  type="date"
                  defaultValue={item.releaseDate ? moment(item.releaseDate.split(' ')[0], 'YYYY-MM-DD') : ''}
                  disabledDate={item.startDate ? current => current < moment(item.startDate, 'YYYY-MM-DD HH:mm:ss') : ''}
                  onChange={(date, dateString) => {
                    this.updateDate('releaseDate', dateString);
                  }}
                >
                  <p>{!_.isNull(item.releaseDate) ? `${item.releaseDate.split('-')[2].substring(0, 2)}/${item.releaseDate.split('-')[1]}/${item.releaseDate.split('-')[0].substring(2, 4)}` : '无'}</p>
                </EasyEdit>
              </div>
              <div className="c7n-backlog-versionItemParam">
                <p style={{ color: 'rgba(0,0,0,0.65)' }}>问题</p>
                <p style={{ padding: '0px 8px', borderRadius: '50%', background: 'rgba(0,0,0,0.26)', color: 'white' }}>{item.issueCount}</p>
              </div>
              <div className="c7n-backlog-versionItemParam">
                <p style={{ color: 'rgba(0,0,0,0.65)' }}>已完成</p>
                <p style={{ padding: '0px 8px', borderRadius: '50%', background: 'rgba(0,0,0,0.26)', color: 'white' }}>{item.doneIssueCount}</p>
              </div>
              <div className="c7n-backlog-versionItemParam">
                <p style={{ color: 'rgba(0,0,0,0.65)' }}>未预估</p>
                <p style={{ padding: '0px 8px', borderRadius: '50%', background: 'rgba(0,0,0,0.26)', color: 'white' }}>{item.notEstimate}</p>
              </div>
              <div className="c7n-backlog-versionItemParam">
                <p style={{ color: 'rgba(0,0,0,0.65)' }}>预估</p>
                <p style={{ padding: '0px 8px', borderRadius: '50%', background: 'rgba(0,0,0,0.26)', color: 'white' }}>{item.totalEstimate}p</p>
              </div>
            </div>
          </div>
        ) : ''}
      </div>
    );
  }
}

export default VersionItem;

