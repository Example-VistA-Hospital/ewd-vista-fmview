ewdVistAFmViewTest ;;
 ;;
 ;unit Testing routine for fmview mumps functions
 D EN^%ut($TEXT(+0),2) ; invoke M-Unit
 Q
ENTRY1 ; @TEST $$RSLVFILE^ewdVistAFmView(%FILE): Resolve a pointer field in file
 ;
 N %FILE,RESULT
 S %FILE="TIU(8925.1,"
 S RESULT="8925.1"
 D CHKEQ^%ut($$RSLVFILE^ewdVistAFmView(%FILE),RESULT)
 ;
 Q  ; end of ENTRY1
ENTRY2 ; @TEST GTDPNDNT^ewdVistAFmView(.DEPNDNT,%FILE): Check Dependent Files
 ;
 N %FILE,RESULT,DEPNDNT,DFILE
 S %FILE=3.8 ; for Mail Group File#3.8
 D GTDPNDNT^ewdVistAFmView(.DEPNDNT,%FILE)
 S DFILE=0
 S RESULT=3.8
 S DFILE=$O(DEPNDNT(DFILE))
 D CHKEQ^%ut(DFILE,RESULT)
 S RESULT=3.816
 S DFILE=$O(DEPNDNT(DFILE))
 D CHKEQ^%ut(DFILE,RESULT)
 S RESULT=200
 S DFILE=$O(DEPNDNT(DFILE))
 D CHKEQ^%ut(DFILE,RESULT)
 Q ; end of ENTRY2
ENTRY3 ; @TEST PKGFILES^ewdVistAFmView(%SESSID): Verify the Session Array Creation for main entry point from FMVieW
 ;
 N %SESSID,ERRMSG
 S %SESSID=10
 S ERRMSG="Error while generating Concept Map"
 K ^TMP("ewd",%SESSID,"concept")
 D PKGFILES^ewdVistAFmView(%SESSID)
 D CHKTF^%ut($D(^TMP("ewd",%SESSID,"concept")),ERRMSG)
 Q ; end of ENTRY3