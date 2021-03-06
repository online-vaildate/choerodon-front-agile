import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import _ from 'lodash';
import { Draggable } from 'react-beautiful-dnd';
import { Icon } from 'choerodon-ui';
import ScrumBoardStore from '../../../../../stores/project/scrumBoard/ScrumBoardStore';
import './StatusIssue.scss';

@inject('AppState')
@observer
class StatusIssue extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  renderIssueDisplay() {
    const dragStartData = ScrumBoardStore.getDragStartItem;
    // 没有开始拖
    if (JSON.stringify(dragStartData) === '{}') {
      return 'visible';
    } else {
      const jsonDraggableId = JSON.parse(dragStartData.draggableId);
      const jsonSource = JSON.parse(dragStartData.source.droppableId);
      if (String(this.props.data.issueId) === String(jsonDraggableId.issueId)) {
        // 如果是当前拖动元素
        return 'visible';
      } else if (String(this.props.droppableId) === String(jsonSource.code)) {
        //   如果是拖动同一列的
        return 'visible';
      } else {
        return 'hidden';
      }
    }
  }
  renderTypeCode(type) {
    const typeCode = this.props.data.typeCode;
    if (typeCode === 'story') {
      if (type === 'background') {
        return '#00BFA5';
      } else {
        return (
          <Icon style={{ color: 'white', fontSize: '14px' }} type="class" />
        );
      }
    } else if (typeCode === 'bug') {
      if (type === 'background') {
        return '#F44336';
      } else {
        return (
          <Icon style={{ color: 'white', fontSize: '14px' }} type="bug_report" />
        );
      }
    } else if (type === 'background') {
      return '#4D90FE';
    } else {
      return (
        <Icon style={{ color: 'white', fontSize: '14px' }} type="assignment" />
      );
    }
  }
  renderStatusBackground() {
    if (this.props.categoryCode === 'todo') {
      return 'rgb(255, 177, 0)';
    } else if (this.props.categoryCode === 'doing') {
      return 'rgb(77, 144, 254)';
    } else if (this.props.categoryCode === 'done') {
      return 'rgb(0, 191, 165)';
    } else {
      return 'gray';
    }
  }
  renderPriorityStyle(type, item) {
    if (type === 'color') {
      if (item.priorityName === '中') {
        return 'rgb(53, 117, 223)';
      } else if (item.priorityName === '高') {
        return 'rgb(255, 177, 0)';
      } else {
        return 'rgba(0, 0, 0, 0.36)';
      }
    } else if (item.priorityName === '中') {
      return 'rgba(77, 144, 254, 0.2)';
    } else if (item.priorityName === '高') {
      return 'rgba(255, 177, 0, 0.12)';
    } else {
      return 'rgba(0, 0, 0, 0.08)';
    }
  }
  render() {
    const item = this.props.data;
    const index = this.props.index;
    return (
      <div>
        <Draggable 
          key={item.issueId} 
          draggableId={JSON.stringify({
            objectVersionNumber: item.objectVersionNumber,
            issueId: item.issueId,
          })} 
          index={index}
        >
          {(provided, snapshot) => 
            (
              <div>
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="c7n-scrumboard-issue"
                  style={{
                    userSelect: 'none',
                    // background: snapshot.isDragging ? 'lightgreen' : 'white',  
                    background: 'white',  
                    minHeight: 83,
                    border: '1px solid rgba(0,0,0,0.20)',
                    // borderLeft: '1px solid rgba(0,0,0,0.20)',
                    // borderRight: '1px solid rgba(0,0,0,0.20)',
                    cursor: 'move',
                    // visibility: this.renderIssueDisplay(),
                    ...provided.draggableProps.style,
                    display: 'flex',
                    overflow: 'hidden',
                    marginBottom: 1,
                  }}
                  role="none"
                  onClick={() => {
                    ScrumBoardStore.setClickIssueDetail(item);
                  }}
                >
                  {/* {item.summary} */}
                  <div style={{ flexGrow: 1 }}>
                    <div
                      label={ScrumBoardStore.getClickIssueDetail.issueId}
                      className="c7n-scrumboard-issueTop"
                      style={{
                        display: ScrumBoardStore.getClickIssueDetail.issueId ? 'block' : 'flex',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                          className="c7n-scrumboard-issueIcon"
                          style={{
                            background: this.renderTypeCode('background'),
                          }}
                        >
                          {this.renderTypeCode('icon')}
                        </div>
                        <p style={{ marginLeft: 5 }} className="textDisplayOneColumn">{item.issueNum}</p>
                      </div>
                      <p
                        style={{
                          margin: ScrumBoardStore.getClickIssueDetail.issueId ? '5px 0 5px 0' : '0 0 0 13px',
                        }}
                      >
                        <span
                          style={{ 
                            borderRadius: 2, 
                            padding: '2px 8px', 
                            background: this.renderStatusBackground(),
                            // background: '#4D90FE', 
                            color: 'white',
                            maxWidth: 56,
                          }}
                          className="textDisplayOneColumn"
                        >
                          {this.props.statusName}
                        </span>
                      </p>
                    </div>
                    <div className="c7n-scrumboard-issueBottom">
                      <p
                        style={{ 
                          flexBasis: '20px',
                          background: this.renderPriorityStyle('background', item),
                          color: this.renderPriorityStyle('color', item),
                          textAlign: 'center',
                        }}
                      >{item.priorityName}</p>
                      <p
                        className="textDisplayOneColumn" 
                        style={{ 
                          flexBasis: '90%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: '20px',
                          paddingLeft: 10,
                        }}
                      >{item.summary}</p>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }} className="c7n-scrumboard-issueSide">M</div>
                </div>
                {provided.placeholder}
              </div>
            )
          }
        </Draggable>
      </div>
      
    );
  }
}

export default StatusIssue;

