<content>
<script lang="ts">
  import { ListView, ObservableArray } from '@nativescript/core';
  
  let conversations = new ObservableArray([
    {
      id: 'conv1',
      propertyId: '1',
      guestName: 'John Smith',
      checkIn: '2024-03-10',
      checkOut: '2024-03-15',
      lastMessage: "Hi! I just checked in but I can't find the WiFi password. Could you help?",
      timestamp: new Date('2024-03-10T14:30:00'),
      unread: true
    }
  ]);

  function onConversationTap(args) {
    const conversation = conversations.getItem(args.index);
    // Navigate to chat
    // frame.navigate({ moduleName: "chat", context: { conversationId: conversation.id } });
  }
</script>

<gridLayout rows="auto, *">
  <label row="0" text="Messages" class="h2 p-10" />
  <listView row="1" items="{conversations}" on:itemTap="{onConversationTap}">
    <Template let:item>
      <gridLayout columns="auto, *, auto" rows="auto, auto" class="conversation-item p-10">
        <label col="0" rowSpan="2" text="👤" class="profile-icon" />
        <label col="1" row="0" text="{item.guestName}" class="font-bold" />
        <label col="1" row="1" text="{item.lastMessage}" textWrap="true" class="message-preview" />
        <stackLayout col="2" rowSpan="2" class="text-right">
          <label text="{item.timestamp.toLocaleTimeString()}" class="time" />
          {#if item.unread}
            <label text="●" class="unread-dot" />
          {/if}
        </stackLayout>
      </gridLayout>
    </Template>
  </listView>
</gridLayout>

<style>
  .conversation-item {
    border-bottom-width: 1;
    border-bottom-color: #e5e5e5;
  }
  .profile-icon {
    font-size: 24;
    margin-right: 10;
  }
  .message-preview {
    color: #666;
    font-size: 14;
  }
  .time {
    font-size: 12;
    color: #999;
  }
  .unread-dot {
    color: #007AFF;
    font-size: 12;
    text-align: right;
  }
</style>
</content>