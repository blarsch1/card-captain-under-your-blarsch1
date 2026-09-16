// Commissioner score persistence hotfix.
// The existing "Save Sleeper Scores" control refreshed scores in the browser
// but did not write them to weekly_player_scores. This capture handler makes
// that control actually persist every displayed Captain score.
(function(){
  async function persistAllDisplayedScores(){
    if(!profile?.is_commissioner) return;
    if(!adminWeekId){
      adminMsg('Week is still loading. Try again.');
      return;
    }

    const btn=document.getElementById('importSleeperScores');
    if(btn){btn.disabled=true;btn.textContent='Saving Sleeper Scores…'}
    adminMsg('Refreshing and saving Sleeper scores…');

    try{
      // First populate the commissioner controls with the latest Sleeper values.
      await hydrateAdminScores();

      const inputs=[...document.querySelectorAll('#adminMatchups .admin-score')];
      if(!inputs.length) throw new Error('No submitted Captain scores found to save.');

      let saved=0;
      for(const input of inputs){
        const player=String(input.dataset.player||'').trim();
        if(!player) continue;
        // A submitted player with no Sleeper points is a real 0.00, not NULL.
        const value=input.value===''?0:Number(input.value);
        if(!Number.isFinite(value)) throw new Error(`Invalid score for ${player}.`);

        const {error}=await client.rpc('set_weekly_player_score',{
          p_week_id:adminWeekId,
          p_player_name:player,
          p_ppr_score:value,
          // Database constraint allows demo, manual, or provider. Sleeper is our provider.
          p_source:'provider'
        });
        if(error) throw error;
        saved++;
      }

      await loadLiveState();
      await loadSubmissionIds();
      await hydrateAdminScores();
      renderAdmin();
      adminMsg(`✓ ${saved} Captain score${saved===1?'':'s'} saved to Card Captain. 0.00 scores are now official.`,true);
    }catch(err){
      console.error('Save Sleeper Scores failed',err);
      adminMsg(err?.message||'Could not save Sleeper scores.');
    }finally{
      if(btn){btn.disabled=false;btn.textContent='⚡ Save Sleeper Scores'}
    }
  }

  // Run before admin.js's older click handler so the button no longer only refreshes.
  document.addEventListener('click',function(e){
    const btn=e.target.closest('#importSleeperScores');
    if(!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    persistAllDisplayedScores();
  },true);
})();
