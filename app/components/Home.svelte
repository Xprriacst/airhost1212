<content>
<script lang="ts">
  import { Page, TabView, TabViewItem } from '@nativescript/core';
  import Properties from './Properties.svelte';
  import Conversations from './Conversations.svelte';
  import Settings from './Settings.svelte';
</script>

<page>
  <actionBar title="AirHost" />
  <tabView androidTabsPosition="bottom">
    <tabViewItem title="Properties" iconSource="res://home">
      <Properties />
    </tabViewItem>
    <tabViewItem title="Messages" iconSource="res://message">
      <Conversations />
    </tabViewItem>
    <tabViewItem title="Settings" iconSource="res://settings">
      <Settings />
    </tabViewItem>
  </tabView>
</page>
</content>